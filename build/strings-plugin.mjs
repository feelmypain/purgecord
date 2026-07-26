import { createFilter } from 'rollup-pluginutils';

export function string(opts = {}) {
  if (!opts.include) {
    throw Error('include option should be specified');
  }

  const filter = createFilter(opts.include, opts.exclude);

  return {
    name: 'string',

    transform(code, id) {
      if (filter(id)) {
        if (opts.transform) code = opts.transform(code, id, opts);
        // The asset is emitted inside a template literal, so anything the
        // template syntax would swallow has to be escaped first.
        const escaped = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
        return {
          code:  'export default (`\n'+ escaped + '\n`);',
          map: { mappings: '' }
        };
      }
    }
  };
}