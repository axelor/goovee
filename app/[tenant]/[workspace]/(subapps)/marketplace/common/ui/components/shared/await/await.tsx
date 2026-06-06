import {Maybe} from '@/types/util';

export async function Await(props: {promise: Promise<Maybe<string | number>>}) {
  return await props.promise;
}
