import { notifications } from "@mantine/notifications";

export const successNotify = (message: string) => {
  notifications.show({
    message,
    color: "green",
    autoClose: 5000,
  });
};

export const errorNotify = (title: string, message: string) => {
  notifications.show({
    title,
    message: (message || "Something went wrong").slice(0, 350),
    color: "red",
    autoClose: 5000,
  });
};
