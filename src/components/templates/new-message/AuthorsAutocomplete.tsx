import React, { useEffect, useState } from "react";
import { useCombobox } from "downshift";
import { api } from "@/utils/api";
import { useDebounce } from "react-use";
import { cn, getFullName } from "@/utils/utils";
import Avatar from "@/components/elements/Avatar";
import RadialProgress from "@/components/elements/RadialProgress";
import { useFormContext } from "react-hook-form";

const AuthorsAutocomplete = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const {
    setValue,
    register,
    formState: { isSubmitSuccessful },
  } = useFormContext();
  const allAuthors = api.messaging.getAllAuthors.useQuery({
    searchKeyword: debouncedSearch,
  });
  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    500,
    [search]
  );

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    selectedItem,
    setInputValue,
    selectItem,
  } = useCombobox({
    onSelectedItemChange: (item) => {
      if (item?.selectedItem?.authorId) {
        setValue("authorId", item.selectedItem.authorId);
      }
    },
    itemToString: (item) =>
      getFullName({
        firstName: item?.firstName,
        lastName: item?.lastName,
        fallback: "Untitled",
      }),
    items: allAuthors.data || [],
    onInputValueChange: ({ inputValue }) => {
      if (inputValue) {
        return setSearch(inputValue);
      }
      return setSearch("");
    },
  });
  console.log("ISS", isSubmitSuccessful);
  useEffect(() => {
    selectItem(null);
    setInputValue("");
  }, [isSubmitSuccessful, selectItem, setInputValue]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "fit-content",
        justifyContent: "center",
        alignSelf: "center",
      }}
      className={"relative flex-1"}
    >
      <div className={"flex w-full items-center justify-between"}>
        <input
          spellCheck="false"
          placeholder={"@friend"}
          className={"relative bg-transparent outline-none"}
          style={{ padding: "4px" }}
          {...getInputProps()}
          data-testid="combobox-input"
        />
        {allAuthors.isLoading && <RadialProgress size={16} />}
      </div>

      {isOpen && !allAuthors.isLoading && (
        <ul
          {...getMenuProps()}
          className={
            "z-50 w-full rounded-sm border-2 border-black bg-warm-gray-50 p-3"
          }
          style={{
            listStyle: "none",
            position: "absolute",
            top: 35,
            left: -1,
          }}
        >
          {allAuthors.data?.map((item, index) => {
            const selected = selectedItem?.authorId === item.authorId;
            return (
              <li
                {...getItemProps({ item, index, key: item.authorId })}
                key={item.authorId}
                className={cn(
                  "flex w-full cursor-pointer items-center rounded-sm py-2 px-3 hover:bg-warm-gray-300",
                  {
                    "bg-warm-gray-300": highlightedIndex === index,
                    "bg-gray-900 hover:bg-gray-900": selected,
                  }
                )}
              >
                <div className={"flex items-center"}>
                  <Avatar size={"xs"} alt={item.firstName.slice(0, 2)} />
                  <p
                    className={cn(
                      "select-none pl-3 text-xs font-normal leading-4",
                      {
                        "text-white": selected,
                      }
                    )}
                  >
                    {item.firstName}
                  </p>
                </div>
                <p
                  className={cn(
                    "select-none pl-3 text-xs font-normal leading-4 text-warm-gray-400",
                    {
                      "text-white": selected,
                    }
                  )}
                >
                  #{item.authorId}
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
