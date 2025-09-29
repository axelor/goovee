import type {TemplateProps} from '../../types';
import type {HR1Data} from './meta';

export function HR1(props: TemplateProps<HR1Data>) {
  const {data} = props;
  const {hr1ClassName: className} = data || {};
  return <hr className={className} data-code={props.code} />;
}
