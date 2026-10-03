import { BadRequestException, StreamableFile } from '@nestjs/common';
import { Readable } from 'node:stream';
import { AttachmentsController } from '../src/attachments/attachments.controller';
import type { AttachmentsService } from '../src/attachments/attachments.service';
import type { CurrentUserPayload } from '../src/common/decorators/current-user.decorator';

describe('AttachmentsController preview', () => {
  const user = { userId: 'user-1' } as CurrentUserPayload;
  const response = () => ({ setHeader: jest.fn() });

  it.each(['application/pdf', 'image/png'])(
    'serves %s inline with safe browser headers',
    async (mimeType) => {
      const stream = Readable.from(Buffer.from('file'));
      const service = {
        getDownloadStream: jest.fn().mockResolvedValue({
          attachment: {
            originalFileName: 'نمونه.pdf',
            name: 'stored.pdf',
            mimeType,
            sizeBytes: 4,
          },
          stream,
        }),
      } as unknown as AttachmentsService;
      const controller = new AttachmentsController(service);
      const res = response();

      const result = await controller.preview('attachment-1', user, res as never);

      expect(result).toBeInstanceOf(StreamableFile);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', mimeType);
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('inline;'),
      );
    },
  );

  it('rejects archive preview while keeping it downloadable', async () => {
    const service = {
      getDownloadStream: jest.fn().mockResolvedValue({
        attachment: {
          originalFileName: 'archive.rar',
          name: 'stored.rar',
          mimeType: 'application/vnd.rar',
          sizeBytes: 4,
        },
        stream: Readable.from(Buffer.from('file')),
      }),
    } as unknown as AttachmentsService;
    const controller = new AttachmentsController(service);

    await expect(
      controller.preview('attachment-1', user, response() as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
