import * as RadixScrollArea from '@radix-ui/react-scroll-area';

const ScrollArea = ({
  children,
  slotProps,
}: {
  slotProps?: {
    root?: React.ComponentProps<typeof RadixScrollArea.Root>;
    viewport?: React.ComponentProps<typeof RadixScrollArea.Viewport>;
  };
  children: React.ReactNode;
}) => {
  return (
    <RadixScrollArea.Root scrollHideDelay={2} {...slotProps?.root}>
      <RadixScrollArea.Viewport {...slotProps?.viewport}>
        {children}
      </RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar orientation="horizontal">
        <RadixScrollArea.Thumb />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Scrollbar orientation="vertical">
        <RadixScrollArea.Thumb />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Corner />
    </RadixScrollArea.Root>
  );
};

export default ScrollArea;
