export function prefixBaseLinks({ base = '/' } = {}) {
  const normalizedBase = base === '/' ? '' : base.replace(/\/$/, '')

  return (tree) => {
    if (!normalizedBase) return
    visit(tree, (node) => {
      if ((node.type === 'link' || node.type === 'image') && isRootPath(node.url)) {
        node.url = `${normalizedBase}${node.url}`
      }

      if (node.type === 'html' && typeof node.value === 'string') {
        node.value = node.value.replace(
          /\b(href|src)=(['"])\/(?!\/)/g,
          `$1=$2${normalizedBase}/`,
        )
      }
    })
  }
}

function isRootPath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
}

function visit(node, callback) {
  callback(node)
  if (!Array.isArray(node.children)) return
  for (const child of node.children) visit(child, callback)
}
