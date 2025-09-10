import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import Wrapper from "./Wrapper";
import {
  sendMessageStream,
  generatedImage,
  generateSpeech,
  generateContent,
} from "../api/gemini"; // Giả sử bạn đã tạo hàm này để gửi tin nhắn đến Gemini
import { Content as GeminiContent } from "@google/genai";
import cloneDeep from "lodash/cloneDeep";
import ApiTimer from "./ApiTimer";
import Select from "./Select";
import { v4 as uuidv4 } from "uuid";
import Lightbox from "react-native-lightbox-v2";
import { Checkbox } from "react-native-paper";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import HeaderMenu from "./HeaderMenu";

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
  {
    label: "voice",
    value: "voice",
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
  type: "user" | "model" | "image" | "audio";
  text?: string;
  image?: string;
  time: number;
};

function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatType, setChatType] = useState("text");
  const [model, setModel] = useState("gemma-3n-e2b-it");
  const [imagenumber, setImageNumber] = useState("0");
  const [targetImage, setTargetImage] = useState("");
  const [voices, setVoices] = useState([{ label: "", value: "" }]);
  const [voice, setVoice] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: "Chi tiết", // đổi title động
      headerRight: () => (
        <HeaderMenu
          items={[
            {
              title: "Delete",
              onPress: async () => {},
            },
          ]}
        />
      ),
    });
  }, []);

  useEffect(() => {
    const fetchVoices = async () => {
      const voices = await Speech.getAvailableVoicesAsync();
      setVoices(
        voices.map((e) => {
          return { label: e.identifier, value: e.identifier };
        })
      );
    };

    fetchVoices();
  }, []);

  function handleSetChatType(value: string) {
    setChatType(value);
    setModel("");
    setImageNumber("0");
  }

  if (chatType === "text") {
    modelList[0] = {
      label: "gemma-3n-e2b-it",
      value: "gemma-3n-e2b-it",
    };
    modelList[1] = {
      label: "gemini-1.5-flash-8b",
      value: "gemini-1.5-flash-8b",
    };
    modelList[2] = {
      label: "gemini-2.0-flash-lite",
      value: "gemini-2.0-flash-lite",
    };
    modelList[3] = {
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
    modelList.splice(1, 1);
  }
  if (chatType === "voice") {
    modelList[0] = {
      label: "gemini-2.5-flash-preview-tts",
      value: "gemini-2.5-flash-preview-tts",
    };
    modelList.splice(1, 1);
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
    const _systemInstruction = `
You have the following array of functions: ['create_field(name, type)', 'create_table(name)', 'create_function(name)', 'create_menu(name, action_name)', 'create_button(name, type)', 'create_tab(name)'].

Based on the user's question:
- Determine which function from the array matches the request.
- If any parameters are missing, ask specific questions to gather those parameters.
- Only when you have the function and all its parameters, ask for confirmation in this format: 
  "Do you want to create <function_name> with <param1> = '...' and <param2> = '...'? "
- If the user confirms (or responds in any way that indicates agreement), reply: 
  "Your request has been executed with <function_name> and parameters: <param1> = '...', <param2> = '...'."
- Do not provide long explanations. Keep the response concise and focused on the function and its parameters.

 
    `;

    const newInput = `${_systemInstruction}. The question is '${input}'`;

    setIsLoading(true);
    const botReplyText = await sendMessageStream(
      model,
      newInput,
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

  async function getVoice() {
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

    setIsLoading(true);
    const botReplyText = await generateSpeech(input);

    const botMessage: ChatMessage = {
      id: uuidv4(),
      type: "audio",
      text: botReplyText,
      time: Date.now(),
    };
    setIsLoading(false);
    setMessages((prev) => [botMessage, ...prev]);
  }

  const handleSend = async () => {
    if (chatType === "text") getChats();
    if (chatType === "image") getImages();
    if (chatType === "voice") getVoice();
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
              {["user", "model"].includes(item.type) && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.messageText}>{item.text}</Text>

                  <Pressable
                    onPress={() => {
                      Speech.speak(item.text || "", {
                        voice: voice,
                      });
                    }}
                    style={({ pressed }) => ({
                      marginLeft: 8,
                      opacity: pressed ? 0.5 : 1,
                      padding: 4,
                      borderRadius: 6,
                    })}
                  >
                    <Ionicons name="volume-high" size={20} color="#555" />
                  </Pressable>
                </View>
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

              {item.type === "audio" && <audio controls src={item.text} />}
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
        <ScrollView keyboardShouldPersistTaps="handled" style={{}}>
          <Select
            label="Chọn Voice"
            data={voices}
            value={voice}
            onChange={setVoice}
          />
        </ScrollView>
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
