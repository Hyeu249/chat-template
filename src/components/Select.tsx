import * as React from "react";
import { List } from "react-native-paper";

type Item = {
  label: string;
  value: string;
};

type SelectProps = {
  label: string;
  data: Item[];
  value: string;
  onChange: (value: string) => void;
};

const Select: React.FC<SelectProps> = ({ label, data, value, onChange }) => {
  const [expanded, setExpanded] = React.useState(false);

  const handlePress = () => setExpanded(!expanded);

  // Tìm label của value hiện tại
  const selectedLabel =
    data.find((item) => item.value === value)?.label || "Chọn...";

  return (
    <List.Section>
      <List.Accordion
        title={`${label}: ${selectedLabel}`}
        expanded={expanded}
        onPress={handlePress}
        left={(props) => <List.Icon {...props} icon="folder" />}
      >
        {data.map((item) => (
          <List.Item
            key={item.value}
            title={item.label}
            onPress={() => {
              onChange(item.value);
              setExpanded(false);
            }}
          />
        ))}
      </List.Accordion>
    </List.Section>
  );
};

export default Select;
