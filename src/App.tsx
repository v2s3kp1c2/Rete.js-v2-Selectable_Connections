import { createEditor } from "./editor";
import { useRete } from "rete-react-plugin";
import { Button } from "antd";
import styled from "styled-components";

const StyledButton = styled(Button)`
  position: absolute;
  top: 1em;
  right: 1em;
`;

export default function App() {
  const [ref, editor] = useRete(createEditor);

  return (
    <div className="App">
      <StyledButton onClick={editor?.removeSelected}>
        Remove selected
      </StyledButton>
      <div ref={ref} style={{ height: "100vh", width: "100vw" }}></div>
    </div>
  );
}
