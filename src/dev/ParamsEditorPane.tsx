import { Editor } from '@monaco-editor/react';

export function ParamsEditorPane(props: {
  params: string;
  setParams: (s: string) => void;
  className?: string;
}) {
  const options = {
    selectOnLineNumbers: true,
    automaticLayout: true,
    fontSize: 14,
    minimap: { enabled: false },
    lineNumbersMinChars: 2,
  };

  return (
    <Editor
      className="h-full w-full"
      language="json"
      value={props.params}
      options={options}
      onChange={(params) => {
        if (props.setParams && params) {
          props.setParams(params);
        }
      }}
    />
  );
}
