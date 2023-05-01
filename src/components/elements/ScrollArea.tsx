import * as RadixScrollArea from "@radix-ui/react-scroll-area";

const ScrollArea = ({
  children,
  componentProps,
}: {
  componentProps?: {
    root?: React.ComponentProps<typeof RadixScrollArea.Root>;
  };
  children: React.ReactNode;
}) => {
  return (
    <RadixScrollArea.Root {...componentProps?.root}>
      <RadixScrollArea.Viewport>{children}</RadixScrollArea.Viewport>
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
