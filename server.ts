import { createServer } from "https";
import { existsSync, mkdirSync } from "fs";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import next from "next";
import { setupSocketIO } from "./src/lib/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3456", 10);

const CERT_DIR = "./certs";
const KEY_PATH = `${CERT_DIR}/key.pem`;
const CERT_PATH = `${CERT_DIR}/cert.pem`;

if (!existsSync(KEY_PATH) || !existsSync(CERT_PATH)) {
  mkdirSync(CERT_DIR, { recursive: true });
  execSync(
    `openssl req -x509 -newkey rsa:2048 -keyout ${KEY_PATH} -out ${CERT_PATH} -days 365 -nodes -subj "/CN=localhost"`,
    { stdio: "pipe" }
  );
  console.log("> Generated self-signed TLS certificate");
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpsServer = createServer(
    { key: readFileSync(KEY_PATH), cert: readFileSync(CERT_PATH) },
    handle
  );
  setupSocketIO(httpsServer);

  httpsServer.listen(port, hostname, () => {
    console.log(`> Ready on https://${hostname}:${port}`);
  });
});
