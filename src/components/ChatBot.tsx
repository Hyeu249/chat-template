import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";
import Wrapper from "./Wrapper";
import {
  sendMessageStream,
  generatedImage,
  generateContent,
} from "../api/gemini"; // Giả sử bạn đã tạo hàm này để gửi tin nhắn đến Gemini
import { Content as GeminiContent } from "@google/genai";
import cloneDeep from "lodash/cloneDeep";
import ApiTimer from "./ApiTimer";
import Select from "./Select";
import { v4 as uuidv4 } from "uuid";
import Lightbox from "react-native-lightbox-v2";
import { Checkbox } from "react-native-paper";
const modelList = [{ label: "", value: "" }];

const chatTypes = [
  {
    label: "text",
    value: "text",
  },
  {
    label: "image",
    value: "image",
  },
];

const imageNumbers = [
  {
    label: "1 image",
    value: "1",
  },
  {
    label: "2 image",
    value: "2",
  },
  {
    label: "3 image",
    value: "3",
  },
  {
    label: "4 image",
    value: "4",
  },
];

type ContentWithId = GeminiContent & {
  id: string;
};

type ChatMessage = {
  id: string;
  type: "user" | "model" | "image";
  text?: string;
  image?: string;
  time: number;
};

function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatType, setChatType] = useState("text");
  const [model, setModel] = useState("gemini-1.5-flash-8b");
  const [imagenumber, setImageNumber] = useState("0");
  const [targetImage, setTargetImage] = useState("");

  function handleSetChatType(value: string) {
    setChatType(value);
    setModel("");
    setImageNumber("0");
  }

  if (chatType === "text") {
    modelList[0] = {
      label: "gemini-1.5-flash-8b",
      value: "gemini-1.5-flash-8b",
    };
    modelList[1] = {
      label: "gemini-2.0-flash-lite",
      value: "gemini-2.0-flash-lite",
    };
    modelList[2] = {
      label: "gemini-2.0-flash",
      value: "gemini-2.0-flash",
    };
  }
  if (chatType === "image") {
    modelList[0] = {
      label: "gemini-2.0-flash-preview-image-generation",
      value: "gemini-2.0-flash-preview-image-generation",
    };
    modelList.splice(1, 1);
    modelList.splice(1, 1);
  }

  async function getChats() {
    if (!input.trim() || !model) return;
    const clonedMessages = cloneDeep(messages);

    const userMessage: ChatMessage = {
      id: uuidv4(),
      type: "user",
      text: input,
      time: Date.now(),
    };

    setMessages((prev) => [userMessage, ...prev]);
    setInput("");

    const history = [
      ...clonedMessages
        .sort((a, b) => a.time - b.time)
        .filter(({ type }) => type !== "image")
        .map(({ type, text }) => {
          return {
            parts: [
              {
                text: text,
              },
            ],
            role: type,
          };
        }),
    ];

    const maxOutputTokens = undefined; // Số lượng token tối đa cho phản hồi
    const temperature = 0.1; // Nhiệt độ của mô hình, có thể điều chỉnh
    const systemInstruction = undefined;

    setIsLoading(true);
    const botReplyText = await sendMessageStream(
      model,
      input,
      maxOutputTokens,
      history,
      temperature,
      systemInstruction
      // [
      //   `Always provide short, concise answers that directly address the question is '${input}'. Avoid unnecessary words.`,
      // ]
    );

    const botMessage: ChatMessage = {
      id: uuidv4(),
      type: "model",
      text: botReplyText,
      time: Date.now(),
    };
    setIsLoading(false);
    setMessages((prev) => [botMessage, ...prev]);
  }

  async function getImages() {
    if (!input.trim() || !model) return;
    setIsLoading(true);
    const clonedMessages = cloneDeep(messages);
    const targetMessage = clonedMessages.filter(
      ({ id, type }) => id === targetImage && type === "image"
    );

    const userMessage: ChatMessage = {
      id: uuidv4(),
      type: "user",
      text: input,
      time: Date.now(),
    };

    setMessages((prev) => [userMessage, ...prev]);
    setInput("");
    const [text, image] = await generateContent(
      model,
      input,
      targetMessage?.[0]?.image || undefined
    );

    const botMessage: ChatMessage = {
      id: uuidv4(),
      type: "model",
      text: text,
      time: Date.now(),
    };
    const botImage: ChatMessage = {
      id: uuidv4(),
      type: "image",
      image: image,
      time: Date.now(),
    };
    const botPackage: ChatMessage[] = [];

    if (image) {
      botPackage.push(botImage);
    }
    if (text) {
      botPackage.push(botMessage);
    }

    setIsLoading(false);
    setMessages((prev) => [...botPackage, ...prev]);
  }

  const handleSend = async () => {
    if (chatType === "text") getChats();
    if (chatType === "image") getImages();
  };

  return (
    <Wrapper>
      <View style={styles.container}>
        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.type === "user" ? styles.user : styles.bot,
              ]}
            >
              {item.type !== "image" && (
                <Text style={styles.messageText}>{item.text}</Text>
              )}
              {item.type === "image" && (
                <Lightbox>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </Lightbox>
              )}

              {item.type === "image" && (
                <Checkbox.Item
                  label="Chọn mục này"
                  status={targetImage === item.id ? "checked" : "unchecked"}
                  onPress={() =>
                    setTargetImage((prev) => (item.id === prev ? "" : item.id))
                  }
                />
              )}
            </View>
          )}
        />

        <ApiTimer isRunning={isLoading} />

        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nhập nội dung..."
            style={[
              styles.input,
              isLoading && styles.inputDisabled, // nếu không editable thì thêm style disabled
            ]}
            onSubmitEditing={handleSend} // Khi nhấn Enter
            returnKeyType="send"
            editable={!isLoading}
          />
          <Button title="Gửi" onPress={handleSend} />
        </View>

        <Select
          label="Text or Image"
          data={chatTypes}
          value={chatType}
          onChange={handleSetChatType}
        />

        <Select
          label="Chọn model"
          data={modelList}
          value={model}
          onChange={setModel}
        />
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  messageBubble: {
    marginVertical: 4,
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
  },
  user: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  bot: {
    backgroundColor: "#EEE",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    width: "100%",
    paddingHorizontal: 25,
    marginBottom: 30,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  image: {
    width: 400,
    height: 400,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  inputDisabled: {
    backgroundColor: "#eee", // màu nền xám nhạt
    color: "#999", // chữ mờ đi
  },
});

export default ChatBot;
