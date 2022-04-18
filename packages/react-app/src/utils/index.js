import { utils } from "web3";

function shortenString(str) {
  return str.substring(0, 6) + "..." + str.substring(str.length - 4);
}

export function shortenAddress(address) {
  try {
    const formattedAddress = utils.toChecksumAddress(address);
    return shortenString(formattedAddress);
  } catch {
    throw new TypeError("Invalid input, address can't be parsed");
  }
}

export function formatEther(str) {
  return Number(utils.fromWei(str))
    .toFixed(2)
    .replace(/\d(?=(\d{3})+\.)/g, "$&,");
}
