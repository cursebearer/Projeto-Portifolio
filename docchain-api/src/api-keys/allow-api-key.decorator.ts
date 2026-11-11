import { SetMetadata } from '@nestjs/common';

export const ALLOW_API_KEY = 'allowApiKey';

// Marca uma rota que também aceita API key (header X-API-Key), além do login por cookie.
export const AllowApiKey = () => SetMetadata(ALLOW_API_KEY, true);
