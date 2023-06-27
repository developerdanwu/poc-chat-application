import { type FileShareMessageEvent } from '@slack/bolt';

export async function fileShare({ data }: { data: FileShareMessageEvent }) {
  // const test = await axios.get(
  //   'https://files.slack.com/files-pri/TJ9DVEPFE-F05ET6Z8DMW/.jpg',
  //   {
  //     baseURL: undefined,
  //     responseType: 'blob',
  //     headers: {
  //       'Accept-Encoding': 'gzip, deflate, br',
  //     },
  //   }
  // );

  return;

  // const test = await genericOpenAiModel
  //   .createImage({
  //     prompt:
  //       'generate a chinese style wedding card in an A4 size that is given to relatives. On 1 half of the sides, there is the english words and on the other half there is the chinese translation',
  //     n: 1,
  //     size: '1024x1024',
  //   })
  //   .catch((e) => console.log(e));

  // const loader = new UnstructuredLoader(test.data);

  // console.log('DD', test.data);
  // const loader = new UnstructuredLoader(
  //   'https://files.slack.com/files-pri/TJ9DVEPFE-F05ET6Z8DMW/download/.jpg'
  // );
  // const test = await loader.load();
}
