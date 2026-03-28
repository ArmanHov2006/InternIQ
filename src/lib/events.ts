export const OPEN_ADD_APPLICATION_EVENT = "interniq:open-add-application";

export const dispatchOpenAddApplication = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_ADD_APPLICATION_EVENT));
};
