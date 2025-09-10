// HeaderMenu.tsx
import React, { useState } from "react";
import { Menu, IconButton } from "react-native-paper";

type Items = {
  title: string;
  onPress: () => void;
};

type Props = {
  items: Items[];
};

const HeaderMenu = ({ items }: Props) => {
  const [visible, setVisible] = useState(false);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <IconButton
          icon="dots-vertical"
          size={24}
          iconColor="red"
          onPress={async () => setVisible(true)}
        />
      }
    >
      {items.map((menu, index) => {
        return (
          <Menu.Item
            key={index}
            onPress={() => {
              menu.onPress();
              setVisible(false);
            }}
            title={menu.title}
          />
        );
      })}
    </Menu>
  );
};

export default HeaderMenu;
