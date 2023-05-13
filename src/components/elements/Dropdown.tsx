import React from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  type DropdownMenuContentProps,
  type DropdownMenuProps,
  type DropdownMenuTriggerProps,
} from "@radix-ui/react-dropdown-menu";

const DropdownMenu = ({
  renderButton,
  children,
  componentProps,
}: {
  componentProps?: {
    root?: DropdownMenuProps;
    triggerProps?: DropdownMenuTriggerProps;
    contentProps?: DropdownMenuContentProps;
  };
  renderButton: (
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
  ) => React.ReactNode;
  children: (
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
  ) => React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <RadixDropdownMenu.Root
      onOpenChange={() => setOpen(false)}
      open={open}
      {...componentProps?.root}
    >
      <RadixDropdownMenu.Trigger asChild {...componentProps?.triggerProps}>
        {renderButton(setOpen)}
      </RadixDropdownMenu.Trigger>

      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          sideOffset={5}
          {...componentProps?.contentProps}
        >
          {children(setOpen)}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
};

export default DropdownMenu;
