import React from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDraggable,
} from "@nextui-org/react";
import { resetSettings, settingsModalOpen } from "@/stores/settingsStore.js";
import { useStore } from "@nanostores/react";
import General from "@/components/Settings/General.jsx";
import Appearance from "@/components/Settings/Appearance.jsx";
import Readability from "@/components/Settings/Readability.jsx";
import { X } from "lucide-react";

export default function App() {
  const isOpen = useStore(settingsModalOpen);
  const targetRef = React.useRef(null);
  const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });

  return (
    <>
      <Modal
        ref={targetRef}
        isOpen={isOpen}
        radius="md"
        scrollBehavior="inside"
        onOpenChange={(value) => settingsModalOpen.set(value)}
        classNames={{
          base: "max-h-[80vh] bg-transparent overflow-hidden",
          header:
            "bg-background border-b border-divider p-3 flex items-center justify-between",
          footer: "hidden",
          body: "modal-body p-0 !block bg-background/80 backdrop-blur-lg",
          closeButton: "hidden",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader {...moveProps}>
                <span>设置</span>
                <Button
                  size="sm"
                  radius="full"
                  variant="light"
                  isIconOnly
                  onPress={() => settingsModalOpen.set(false)}
                >
                  <X className="size-3" />
                </Button>
              </ModalHeader>
              <ModalBody>
                <div className="p-3 overflow-y-auto flex flex-col gap-4">
                  <General />
                  <Appearance />
                  <Readability />
                  <Button color="danger" variant="flat" onPress={resetSettings}>
                    重 置
                  </Button>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
