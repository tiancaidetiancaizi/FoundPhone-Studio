let ownerName = "";
let ownerAvatar = "";

/**
 * 记录机主昵称与头像（由 Phone 在载入作品时调用）。
 * 各皮肤中的 Avatar 组件通过 ownerAvatarFor 自动匹配机主头像，
 * 保证系统内任何位置显示机主头像时都是同一张图。
 */
export function setOwnerIdentity(name: string, avatar: string) {
  ownerName = name || "";
  ownerAvatar = avatar || "";
}

export function ownerAvatarFor(name: string): string {
  return name && name === ownerName ? ownerAvatar : "";
}
