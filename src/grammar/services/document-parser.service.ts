import { Injectable, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import * as path from 'path';

@Injectable()
export class DocumentParserService {

  async parse(file: any): Promise<string> {
    if (!file) {
      throw new BadRequestException('Document is required');
    }

    console.log('File Name :', file.originalname);
    console.log('Mime Type :', file.mimetype);

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

    return result.text;
  }

  private async parsePptx(file: any): Promise<string> {
    // TODO: Implement PPTX parsing
    return '';
  }
}