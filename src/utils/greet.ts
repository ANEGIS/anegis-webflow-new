import { getPublishDate } from '@finsweet/ts-utils';

/**
 * Logs build information to the console.
 */
export const greetUser = () => {
  const publishDate = getPublishDate();

  console.log('index.js loaded');
  console.log(
    `Last published: ${publishDate?.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })}`
  );

  if (process.env.NODE_ENV === 'development') {
    console.log('🚧 Running in development mode');
  }
};
