import { useFormContext } from 'react-hook-form';
import cn from 'clsx';
import { RiSendPlane2Fill } from 'react-icons/ri';

const TextEditorSendBar = () => {
  const { formState } = useFormContext();
  return (
    <div className="flex justify-between">
      <div></div>
      <button
        disabled={!formState.isValid}
        className={cn('btn-primary btn-sm btn', {
          'btn-disabled': !formState.isValid,
        })}
      >
        <RiSendPlane2Fill />
      </button>
    </div>
  );
};

export default TextEditorSendBar;
