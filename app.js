const restify = require("restify");
const builder = require("botbuilder");

// Get secrets from server environment
const botConnectorOptions = {
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
};

const defaultDialogOptions = {
  createTodo: "Создать задание",
  listTodos: "Посмотреть задания"
};

// Create bot
const connector = new builder.ChatConnector(botConnectorOptions);
const bot = new builder.UniversalBot(connector, [
  session => {
    session.send(
      "Привет! я Xbri, я буду помогать тебе становится продуктивным!"
      // "Все что ты сюда пишешь я сохраню в промежуточной папке InBasket"
    );
    builder.Prompts.choice(
      session,
      "Что вы хотите сделать?",
      [defaultDialogOptions.createTodo, defaultDialogOptions.listTodos],
      {
        listStyle: builder.ListStyle.button
      }
    );
  },

  (session, result) => {
    if (result.response) {
      switch (result.response.entity) {
        case defaultDialogOptions.createTodo:
          session.beginDialog("createTodo");
          break;
        case defaultDialogOptions.listTodos:
          session.beginDialog("listTodos");
          break;
      }
    } else {
      session.send(
        `I am sorry but I didn't understand that. I need you to select one of the options below`
      );
    }
  }
]);

bot.dialog("createTodo", [
  session => {
    builder.Prompts.text(session, "Пожалуйста введите задание");
  },

  (session, result) => {
    if (result.response) {
      if (session.userData.todos) {
        session.userData.todos.push(result.response);
      } else {
        session.userData.todos = [result.response];
      }
      session.endDialog("Записал!");
    } else {
      session.send(
        `I am sorry but I didn't understand that. I need you to select one of the options below`
      );
    }
  }
]);

bot.dialog("listTodos", [
  session => {
    session.send(`Вот ваши задания:${session.userData.todos}`);
    session.endDialog();
  }
]);

// Setup Restify Server
const server = restify.createServer();

// Handle Bot Framework messages
server.post("/api/messages", connector.listen());

// Serve a static web page
server.get(
  /.*/,
  restify.serveStatic({
    directory: ".",
    default: "index.html"
  })
);

server.listen(process.env.port || 3978, function() {
  console.log("%s listening to %s", server.name, server.url);
});
