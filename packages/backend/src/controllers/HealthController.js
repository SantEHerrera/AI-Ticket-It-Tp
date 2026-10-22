export async function getHealth(_req, res) {
  return res.status(200).json({ status: "ok" })
}