import { defineDocumentType, makeSource } from 'contentlayer/source-files';

export const Product = defineDocumentType(() => ({
  name: 'Product',
  filePathPattern: `products/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    name: { type: 'string', required: true },
    description: { type: 'string', required: true },
    category: { type: 'string', required: true },
    imageUrl: { type: 'string', required: true },
    dailyPrice: { type: 'number', required: true },
    weekendPrice: { type: 'number', required: true },
    weeklyPrice: { type: 'number', required: true },
    deposit: { type: 'number', required: true },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace('products/', ''),
    },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Product],
}); 