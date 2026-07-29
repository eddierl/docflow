export async function uploadDocument(request: any) {
  return request.post("/documents", {
    multipart: {
      file: {
        name: "test.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("hello docflow"),
      },
    },
  });
}
