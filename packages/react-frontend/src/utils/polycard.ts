export const parsePolycardNumber = (data: string): string | null => {
  const match = data.match(/;(\d+)\?/)
  return match ? match[1] : null
}
