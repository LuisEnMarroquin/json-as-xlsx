module.exports = {
  pages: {
    index: {
      entry: "examples/vue-app/main.js",
      template: "examples/vue-app/public/index.html",
      filename: "index.html",
      title: "Index Page",
      chunks: ["chunk-vendors", "chunk-common", "index"],
    },
  },
  publicPath: process.env.NODE_ENV === "production" ? "/" : "/",
}
