export const validateVimeoUrl = (value = ""): boolean =>
  !!value.match(/(?:https?:\/\/(?:www\.)?)?vimeo.com\/(?:channels\/|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d{4,9})(?:$|\/|\?)/)