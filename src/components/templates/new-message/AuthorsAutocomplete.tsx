import React, { useState } from 'react';
import { useCombobox, useMultipleSelection } from 'downshift';
import { api } from '@/lib/api';
import { useDebounce } from 'react-use';
import { cn, useApiTransformUtils } from '@/lib/utils';
import RadialProgress from '@/components/elements/RadialProgress';
import { useFormContext } from 'react-hook-form';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/elements/avatar';
import { type RouterOutput } from '@/server/api/root';

const AuthorsAutocomplete = () => {
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { getFullName } = useApiTransformUtils();
  const [inputValue, setInputValue] = useState('');
  const [selectedItems, setSelectedItems] = React.useState<
    RouterOutput['messaging']['getAllAuthors']
  >([]);
  const {
    setValue,
    formState: { isSubmitSuccessful },
  } = useFormContext();
  const allAuthors = api.messaging.getAllAuthors.useQuery({
    searchKeyword: debouncedSearch,
  });
  useDebounce(
    () => {
      setDebouncedSearch(inputValue);
    },
    500,
    [inputValue]
  );

  console.log('SELECTED', selectedItems);
  const { getSelectedItemProps, getDropdownProps, removeSelectedItem } =
    useMultipleSelection({
      selectedItems,
      onStateChange({ selectedItems: newSelectedItems, type }) {
        switch (type) {
          case useMultipleSelection.stateChangeTypes
            .SelectedItemKeyDownBackspace:
          case useMultipleSelection.stateChangeTypes.SelectedItemKeyDownDelete:
          case useMultipleSelection.stateChangeTypes.DropdownKeyDownBackspace:
          case useMultipleSelection.stateChangeTypes.FunctionRemoveSelectedItem:
            {
              if (newSelectedItems) {
                setSelectedItems(newSelectedItems);
              }
            }
            break;
          default:
            break;
        }
      },
    });

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    inputValue,
    selectedItem: null,
    stateReducer(state, actionAndChanges) {
      const { changes, type } = actionAndChanges;
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputBlur:
          return {
            ...changes,
            ...(changes.selectedItem && { isOpen: true, highlightedIndex: 0 }),
          };
        default:
          return changes;
      }
    },
    onStateChange({
      inputValue: newInputValue,
      type,
      selectedItem: newSelectedItem,
    }) {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          {
            if (newSelectedItem) {
              setSelectedItems((prev) => [...prev, newSelectedItem]);
            }
          }

          break;
        case useCombobox.stateChangeTypes.InputChange:
          {
            if (newInputValue) {
              setInputValue(newInputValue);
            }
          }
          break;
        default:
          break;
      }
    },
    itemToString: (item) =>
      getFullName({
        firstName: item?.first_name,
        lastName: item?.last_name,
        fallback: 'Untitled',
      }),
    items: allAuthors.data || [],
  });

  return (
    <div className="relative flex flex-1 flex-col justify-center self-center">
      <div className="flex w-full items-center justify-between">
        <input
          autoFocus
          spellCheck="false"
          placeholder="@friend"
          className="relative w-full bg-transparent outline-none"
          style={{ padding: '4px' }}
          {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
          data-testid="combobox-input"
        />
        {allAuthors.isLoading && <RadialProgress size={16} />}
      </div>

      {isOpen && !allAuthors.isLoading && (
        <ul
          {...getMenuProps()}
          className="z-50 w-full rounded-md border border-slate-300 bg-white py-3"
          style={{
            listStyle: 'none',
            position: 'absolute',
            top: 35,
            left: -1,
          }}
        >
          {allAuthors.data?.map((item, index) => {
            const selectedItemsAuthorIds = selectedItems.map(
              (author) => author.author_id
            );
            const selected = selectedItemsAuthorIds.includes(item.author_id);
            return (
              <li
                {...getItemProps({ item, index, key: item.author_id })}
                key={item.author_id}
                className={cn(
                  'hover:bg-warm-gray-300 flex w-full cursor-pointer items-center py-2 px-3',
                  {
                    'bg-slate-100': highlightedIndex === index,
                    'bg-slate-200 hover:bg-slate-300': selected,
                  }
                )}
              >
                <div className="flex items-center">
                  <Avatar size="sm">
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="@shadcn"
                    />
                    <AvatarFallback>item.first_name.slice(0, 2)</AvatarFallback>
                  </Avatar>
                  <p
                    className={cn(
                      'select-none pl-3 text-xs font-normal leading-4 text-slate-900'
                    )}
                  >
                    {item.first_name}
                  </p>
                </div>
                <p
                  className={cn(
                    'select-none pl-3 text-xs font-normal leading-4 text-slate-400'
                  )}
                >
                  #{item.author_id}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AuthorsAutocomplete;
