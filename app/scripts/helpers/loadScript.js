const replaceNodeScript = node => {
  if (isNodeScript(node) === true) {
    node.parentNode.replaceChild(cloneNodeScript(node), node);
  } else {
    let i = 0;
    const children = node.childNodes;
    while (i < children.length) {
      replaceNodeScript(children[i++]);
    }
  }

  return node;
};
const isNodeScript = node => node.tagName === 'SCRIPT';
const cloneNodeScript = node => {
  const script = document.createElement('script');
  script.text = node.innerHTML;
  for (let i = node.attributes.length - 1; i >= 0; i--) {
    script.setAttribute(node.attributes[i].name, node.attributes[i].value);
  }
  return script;
};

export default replaceNodeScript;
