import { Injectable, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import pptx2json from 'pptx2json';

@Injectable()
export class DocumentParserService {

  async parse(file: any): Promise<string> {
    if (!file) {
      throw new BadRequestException('Document is required');
    }


    const extension = path.extname(file.originalname).toLowerCase();

    switch (extension) {
      case '.docx':
        return this.parseDocx(file);

      case '.pdf':
        return this.parsePdf(file);

      case '.pptx':
        return this.parsePptx(file);

      default:
        throw new BadRequestException(
          'Only DOCX, PDF and PPTX files are supported',
        );
    }
  }

  private async parseDocx(file: any): Promise<string> {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });
 
    return result.value;
  }

private async parsePdf(file: any): Promise<string> {
  const parser = new PDFParse({
    data: file.buffer,
  });

  const result = await parser.getText();

  await parser.destroy();

  let text = result.text;

  // remove page numbers
  text = text.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '');

  // remove "Page 1"
  text = text.replace(/^Page\s+\d+$/gim, '');

  // remove "1 / 14"
  text = text.replace(/^\d+\s*\/\s*\d+$/gim, '');

  // trim every line
  text = text
    .split('\n')
    .map(x => x.trim())
    .join('\n');

  // remove multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

private async parsePptx(file: any): Promise<string> {
  const PPTX2Json = require('pptx2json');

  const parser = new PPTX2Json();

  const json = await parser.buffer2json(file.buffer);

  let text = '';

  const slideFiles = Object.keys(json)
    .filter(key => key.startsWith('ppt/slides/slide'))
    .sort();

  for (const slidePath of slideFiles) {
    const slide = json[slidePath];

    const slideText = this.extractText(slide);

    text += this.extractText(slide);
    text += '\n';
  }

  return text.trim();
}
private extractText(obj: any): string {
  let result = '';

  const walk = (node: any) => {

    if (node == null) {
      return;
    }

    if (typeof node === 'string') {
      result += node + '\n';
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (typeof node === 'object') {

      if (node['a:t']) {

        if (Array.isArray(node['a:t'])) {

          node['a:t'].forEach((x: any) => {

            if (typeof x === 'string') {
              result += x + '\n';
            }

          });

        } else {

          result += node['a:t'] + '\n';

        }

      }

      Object.values(node).forEach(walk);

    }

  };

  walk(obj);

  return result;
}
}