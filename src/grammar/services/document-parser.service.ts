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

  const result =
    await mammoth.extractRawText({
      buffer: file.buffer,
    });

  return result.value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

  const json =
    await parser.buffer2json(file.buffer);

  const slideFiles = Object.keys(json)
    .filter(key =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(key)
    )
    .sort((a, b) => {

      const aNum =
        Number(
          a.match(/slide(\d+)/i)?.[1] || 0
        );

      const bNum =
        Number(
          b.match(/slide(\d+)/i)?.[1] || 0
        );

      return aNum - bNum;
    });


  const slides: string[] = [];


  for (const slidePath of slideFiles) {

    const slide =
      json[slidePath];

    const slideText =
      this.extractPptText(slide);

    if (slideText.trim()) {

      slides.push(
        `SECTION: Slide ${slides.length + 1}\n${slideText}`
      );

    }

  }


  return slides.join('\n\n').trim();
}
private extractPptText(obj: any): string {

  const texts: string[] = [];

  const walk = (node: any): void => {

    if (!node) {
      return;
    }


    if (Array.isArray(node)) {

      node.forEach(item =>
        walk(item)
      );

      return;
    }


    if (typeof node !== 'object') {
      return;
    }


    if (node['a:t']) {

      const value = node['a:t'];

      if (Array.isArray(value)) {

        value.forEach(item => {

          if (
            typeof item === 'string' &&
            item.trim()
          ) {

            texts.push(
              item.trim()
            );

          }

        });

      } else if (
        typeof value === 'string' &&
        value.trim()
      ) {

        texts.push(
          value.trim()
        );

      }

    }


    Object.keys(node)
      .forEach(key => {

        if (key !== 'a:t') {
          walk(node[key]);
        }

      });

  };


  walk(obj);


  return [
    ...new Set(texts)
  ].join('\n');
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