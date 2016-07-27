// @flow weak

import isStatelessComponent from './isStatelessComponent';

function isReactClass(superClass, scope) {
  let answer = false;

  if (superClass.matchesPattern('React.Component') ||
    (superClass.node.name === 'Component')) {
    answer = true;
  } else if (superClass.node.name) { // Check for inheritance
    const className = superClass.node.name;
    const binding = scope.getBinding(className);
    superClass = binding.path.get('superClass');

    if (superClass.matchesPattern('React.Component') ||
      (superClass.node && superClass.node.name === 'Component')) {
      answer = true;
    }
  }

  return answer;
}

function remove(path, options) {
  const {
    visitedKey,
    wrapperIfTemplate,
    mode,
    type,
  } = options;

  if (mode === 'remove') {
    path.remove();
  } else if (mode === 'wrap') {
    if (path.node[visitedKey]) {
      return;
    }

    path.node[visitedKey] = true;

    switch (type) {
      // This is legacy, we do not optimize it.
      case 'createClass':
        break;

      case 'class static':
        break;

      case 'class assign':
      case 'stateless':
        path.replaceWith(wrapperIfTemplate(
          {
            NODE: path.node,
          }
        ));
        break;
    }
  } else {
    throw new Error(`transform-react-remove-prop-type: unsupported mode ${mode}.`);
  }
}

export default function({template}) {
  const wrapperIfTemplate = template(`
    if (process.env.NODE_ENV !== "production") {
      NODE;
    }
  `);

  const VISITED_KEY = `transform-react-remove-prop-types${Date.now()}`;

  return {
    visitor: {
      Program(programPath, state) {
        const mode = state.opts.mode || 'remove';

        // On program start, do an explicit traversal up front for this plugin.
        programPath.traverse({
          ObjectProperty: {
            exit(path) {
              const node = path.node;

              if (node.computed || node.key.name !== 'propTypes') {
                return;
              }

              const parent = path.findParent((currentNode) => {
                if (currentNode.type !== 'CallExpression') {
                  return false;
                }

                return currentNode.get('callee').matchesPattern('React.createClass');
              });

              if (parent) {
                remove(path, {
                  visitedKey: VISITED_KEY,
                  wrapperIfTemplate: wrapperIfTemplate,
                  mode: mode,
                  type: 'createClass',
                });
              }
            },
          },
          ClassProperty(path) {
            const {
              node,
              scope,
            } = path;

            if (node.key.name === 'propTypes') {
              const superClass = scope.path.get('superClass');

              if (isReactClass(superClass, scope)) {
                remove(path, {
                  visitedKey: VISITED_KEY,
                  wrapperIfTemplate: wrapperIfTemplate,
                  mode: mode,
                  type: 'class static',
                });
              }
            }
          },
          AssignmentExpression(path) {
            const {
              node,
              scope,
            } = path;

            if (node.left.computed || !node.left.property || node.left.property.name !== 'propTypes') {
              return;
            }

            const className = node.left.object.name;
            const binding = scope.getBinding(className);

            if (!binding) {
              return;
            }

            if (binding.path.isClassDeclaration()) {
              const superClass = binding.path.get('superClass');

              if (isReactClass(superClass, scope)) {
                remove(path, {
                  visitedKey: VISITED_KEY,
                  wrapperIfTemplate: wrapperIfTemplate,
                  mode: mode,
                  type: 'class assign',
                });
              }
            } else if (isStatelessComponent(binding.path)) {
              remove(path, {
                visitedKey: VISITED_KEY,
                wrapperIfTemplate: wrapperIfTemplate,
                mode: mode,
                type: 'stateless',
              });
            }
          },
        });
      },
    },
  };
}
