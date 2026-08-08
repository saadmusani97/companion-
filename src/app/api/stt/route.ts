const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: Request): Promise<Response> {
  if (!GROQ_API_KEY) {
    return Response.json({ error: "GROQ_API_KEY not set" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Missing audio file" }, { status: 400 });
  }

  console.log("[stt] received file — size:", file.size, "type:", file.type, "name:", file.name);

  // Groq Whisper requires a correct file extension to detect the codec.
  // Derive the extension from the blob's MIME type so it always matches.
  let ext = "webm";
  const type = file.type.toLowerCase();
  if (type.includes("ogg"))  ext = "ogg";
  else if (type.includes("mp4")) ext = "mp4";
  else if (type.includes("wav")) ext = "wav";
  else if (type.includes("mpeg") || type.includes("mp3")) ext = "mp3";
  else if (type.includes("flac")) ext = "flac";

  const filename = `audio.${ext}`;
  console.log("[stt] sending to Groq as:", filename);

  const upstream = new FormData();
  upstream.append("file", file, filename);
  upstream.append("model", "whisper-large-v3-turbo");
  upstream.append("response_format", "json");
  upstream.append("language", "en");

  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: upstream,
    });
  } catch (err) {
    console.error("[stt] network error:", err);
    return Response.json({ error: "Network error reaching Groq" }, { status: 502 });
  }

  if (!res.ok) {
    const body = await res.text();
    console.error("[stt] Groq error:", res.status, body);
    return Response.json(
      { error: `Groq STT failed (${res.status}): ${body.slice(0, 1000)}` },
      { status: res.status },
    );
  }

  const data = await res.json() as { text?: string };
  const text = (data.text ?? "").trim();
  console.log("[stt] transcript:", JSON.stringify(text));

  return Response.json({ text });
}
