declare module "culori";

declare module "jsdom" {
  export class JSDOM {
    constructor(html?: string | Buffer | ArrayBufferView, options?: any);
    window: any;
    windowDocument: any;
  }
}
