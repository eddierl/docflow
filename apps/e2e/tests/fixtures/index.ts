export const Fixtures = {
  textHello: {
    file: "text/hello.txt",
    mimeType: "text/plain",
  },
  textEmpty: {
    file: "text/empty.txt",
    mimeType: "text/plain",
  },
  textPdf: {
    file: "pdf/Just another test on the wall.pdf",
    mimeType: "application/pdf",
  },

  scannedPdf: {
    file: "pdf/scanned.pdf",
    mimeType: "application/pdf",
  },

  invoiceImage: {
    file: "images/invoice.png",
    mimeType: "image/png",
  },

  zip: {
    file: "unsupported/archive.zip",
    mimeType: "application/zip",
  },
} satisfies Record<string, FixtureDefinition>;

export interface FixtureDefinition {
  mimeType: string;
  file: string;
}
