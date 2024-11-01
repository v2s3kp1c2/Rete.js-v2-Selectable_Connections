import { createRoot } from "react-dom/client";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import {
  BidirectFlow,
  ConnectionPlugin,
  Presets as ConnectionPresets
} from "rete-connection-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import { SelectableConnection } from "./SelectableConnection";
import { removeNodeWithConnections } from "./utils";

class Connection extends ClassicPreset.Connection<
  ClassicPreset.Node,
  ClassicPreset.Node
> {
  selected?: boolean;
}

type Schemes = GetSchemes<ClassicPreset.Node, Connection>;
type AreaExtra = ReactArea2D<Schemes>;

export async function createEditor(container: HTMLElement) {
  const socket = new ClassicPreset.Socket("socket");

  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });

  const selector = AreaExtensions.selector();
  const accumulating = AreaExtensions.accumulateOnCtrl();

  AreaExtensions.selectableNodes(area, selector, { accumulating });

  function SelectableConnectionBind(props: { data: Schemes["Connection"] }) {
    const id = props.data.id;
    const label = "connection";

    return (
      <SelectableConnection
        {...props}
        click={() => {
          selector.add(
            {
              id,
              label,
              translate() {},
              unselect() {
                props.data.selected = false;
                area.update("connection", id);
              }
            },
            accumulating.active()
          );
          props.data.selected = true;
          area.update("connection", id);
        }}
      />
    );
  }

  render.addPreset(
    Presets.classic.setup({
      customize: {
        connection() {
          return SelectableConnectionBind;
        }
      }
    })
  );

  connection.addPreset(() => new BidirectFlow());
  // connection.addPreset(ConnectionPresets.classic.setup());

  editor.use(area);
  area.use(connection);
  area.use(render);

  AreaExtensions.simpleNodesOrder(area);

  const a = new ClassicPreset.Node("A");
  a.addControl("a", new ClassicPreset.InputControl("text", { initial: "a" }));
  a.addOutput("a", new ClassicPreset.Output(socket));
  await editor.addNode(a);

  const b = new ClassicPreset.Node("B");
  b.addControl("b", new ClassicPreset.InputControl("text", { initial: "b" }));
  b.addInput("b", new ClassicPreset.Input(socket));
  await editor.addNode(b);

  const с = new ClassicPreset.Node("С");
  с.addControl("с", new ClassicPreset.InputControl("text", { initial: "с" }));
  с.addOutput("с", new ClassicPreset.Input(socket));
  await editor.addNode(с);

  await editor.addConnection(new Connection(a, "a", b, "b"));
  await editor.addConnection(new Connection(с, "с", b, "b"));

  await area.translate(a.id, { x: 0, y: 0 });
  await area.translate(b.id, { x: 270, y: 100 });
  await area.translate(с.id, { x: 0, y: 180 });

  setTimeout(() => {
    // wait until nodes rendered because they dont have predefined width and height
    AreaExtensions.zoomAt(area, editor.getNodes());
  }, 10);
  return {
    removeSelected: async () => {
      for (const item of [...editor.getConnections()]) {
        if (item.selected) {
          await editor.removeConnection(item.id);
        }
      }
      for (const item of [...editor.getNodes()]) {
        if (item.selected) {
          await removeNodeWithConnections(editor, item.id);
        }
      }
    },
    destroy: () => area.destroy()
  };
}
