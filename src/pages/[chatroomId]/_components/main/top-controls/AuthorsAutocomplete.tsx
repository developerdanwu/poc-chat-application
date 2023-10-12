import React, { useState } from 'react';
import { useCombobox, useMultipleSelection } from 'downshift';
import { api } from '@/lib/api';
import { useDebounce } from 'react-use';
import { cn, useApiTransformUtils } from '@/lib/utils';
import RadialProgress from '@/components/elements/RadialProgress';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/elements/avatar';
import { type RouterOutput } from '@/server/api/root';
import { IconButton } from '@/components/elements/IconButton';
import { XIcon } from 'lucide-react';

const AuthorsAutocomplete = ({
  value,
  onChange,
}: {
  value: RouterOutput['chatroom']['getAllHumanAuthors'];
  onChange: (
    selectedItems: RouterOutput['chatroom']['getAllHumanAuthors']
  ) => void;
}) => {
  const { getFullName } = useApiTransformUtils();
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [inputValue, setInputValue] = useState('');

  const allAuthors = api.chatroom.getAllHumanAuthors.useQuery(
    {
      searchKeyword: debouncedSearch,
    },
    {
      keepPreviousData: true,
    }
  );
  useDebounce(
    () => {
      setDebouncedSearch(inputValue);
    },
    500,
    [inputValue]
  );

  const {
    getSelectedItemProps,
    getDropdownProps,
    removeSelectedItem,
    addSelectedItem,
  } = useMultipleSelection({
    selectedItems: value,
    onStateChange({ selectedItems: newSelectedItems, type, activeIndex }) {
      switch (type) {
        case useMultipleSelection.stateChangeTypes.SelectedItemKeyDownBackspace:
        case useMultipleSelection.stateChangeTypes.SelectedItemKeyDownDelete:
        case useMultipleSelection.stateChangeTypes.DropdownKeyDownBackspace:
        case useMultipleSelection.stateChangeTypes.FunctionRemoveSelectedItem:
        case useMultipleSelection.stateChangeTypes.FunctionAddSelectedItem: {
          if (newSelectedItems) {
            onChange(newSelectedItems);
          }
          break;
        }

        default:
          break;
      }
    },
  });

  const {
    closeMenu,
    isOpen,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    inputValue,
    selectedItem: null,
    defaultHighlightedIndex: 0,
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
        case useCombobox.stateChangeTypes.ItemClick: {
          if (newSelectedItem) {
            const selectedIndex = value.findIndex(
              (val) => val.author_id === newSelectedItem.author_id
            );

            if (selectedIndex === -1) {
              addSelectedItem(newSelectedItem);
            } else {
              onChange(
                value.filter(
                  (item) => item.author_id !== newSelectedItem.author_id
                )
              );
            }
            setInputValue('');
            closeMenu();
            break;
          }

          break;
        }
        case useCombobox.stateChangeTypes.InputChange: {
          if (!newInputValue) {
            setInputValue('');
            break;
          }
          if (newInputValue) {
            setInputValue(newInputValue);
            break;
          }
          break;
        }

        default:
          break;
      }
    },
    onInputValueChange: (changes) => {
      if (changes.inputValue) {
        setInputValue(changes.inputValue);
      }
    },
    items: allAuthors.data || [],
  });

  return (
    <div className="relative flex flex-1 flex-col justify-center self-center">
      <div className="flex w-full items-center justify-between">
        <div className="inline-flex w-full space-x-1">
          {value.map((item, index) => {
            return (
              <div
                key={`selected-item-${item.author_id}`}
                className="flex items-center space-x-1 rounded-full border border-slate-300 bg-slate-100"
                {...getSelectedItemProps({
                  selectedItem: item,
                  index,
                })}
              >
                <Avatar size="sm">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback>{item.first_name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <p className="whitespace-nowrap text-body text-slate-500">
                  {item.first_name} {item.last_name}
                </p>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSelectedItem(item);
                  }}
                  variant="ghost"
                  size="sm"
                >
                  <XIcon size={12} />
                </IconButton>
              </div>
            );
          })}
          <input
            autoFocus
            spellCheck="false"
            placeholder={value.length < 1 ? '@friend' : ''}
            className="relative w-full bg-transparent outline-none"
            style={{ padding: '4px' }}
            {...getInputProps({
              ...getDropdownProps({
                preventKeyAction: isOpen,
              }),
              onKeyDown: (e) => {
                if (e.key === 'Backspace' && !inputValue) {
                  onChange(value.slice(0, -1));
                  // setSelectedItems((prev) => prev.slice(0, -1));
                }
              },
            })}
            data-testid="combobox-input"
          />
        </div>

        {allAuthors.isLoading && <RadialProgress size={16} />}
      </div>

      {isOpen && (
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
            const selectedItemsAuthorIds = value.map(
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
                    'bg-slate-200': selected,
                    'bg-slate-100': highlightedIndex === index,
                    'bg-slate-300': highlightedIndex === index && selected,
                  }
                )}
              >
                <div className="flex items-center">
                  <Avatar size="sm">
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="@shadcn"
                    />
                    <AvatarFallback>
                      {item.first_name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <p
                    className={cn(
                      ' select-none whitespace-nowrap pl-3 text-xs font-normal leading-4 text-slate-900'
                    )}
                  >
                    {getFullName({
                      firstName: item.first_name,
                      lastName: item.last_name,
                      fallback: 'Untitled',
                    })}
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
