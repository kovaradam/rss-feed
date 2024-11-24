import React from 'react';

export function Highlight(props: { query: string; input: string }) {
  const elements = React.useMemo(() => {
    if (!props.query) {
      return [{ element: props.input, key: 0 }];
    }
    const startIndices: number[] = [];
    const query = props.query.toLowerCase();
    const input = props.input.toLowerCase();

    let lastIdx = input.indexOf(query);

    while (lastIdx !== -1) {
      startIndices.push(lastIdx);
      lastIdx = input.indexOf(query, lastIdx + 1);
    }
    let key = 0;
    const elements: { element: React.ReactNode; key: number }[] = [
      { element: props.input.slice(0, startIndices[0]), key: key++ },
    ];

    startIndices.forEach((startIdx, arrayIdx) => {
      elements.push({
        element: (
          <strong>
            {props.input.slice(startIdx, startIdx + props.query.length)}
          </strong>
        ),
        key: key++,
      });
      elements.push({
        element: props.input.slice(
          startIdx + props.query.length,
          startIndices[arrayIdx + 1]
        ),
        key: key++,
      });
    });
    return elements;
  }, [props.query, props.input]);

  return (
    <>
      {elements.map(({ element, key }) => (
        <React.Fragment key={key}>{element}</React.Fragment>
      ))}
    </>
  );
}
