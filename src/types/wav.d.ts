
declare module 'wav' {
  import { Transform, TransformOptions } from 'stream';

  export interface WriterOptions extends TransformOptions {
    channels?: number;
    sampleRate?: number;
    bitDepth?: number;
  }

  export class Writer extends Transform {
    constructor(options?: WriterOptions);
  }

  // Add other exports from the 'wav' module if needed
}
