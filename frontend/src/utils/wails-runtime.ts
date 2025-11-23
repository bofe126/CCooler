// Wails Runtime Events API
declare global {
  interface Window {
    runtime?: {
      EventsOn: (eventName: string, callback: (data: any) => void) => () => void;
      EventsOff: (eventName: string) => void;
    };
  }
}

export const EventsOn = (eventName: string, callback: (data: any) => void): (() => void) | undefined => {
  if (typeof window !== 'undefined' && window.runtime) {
    return window.runtime.EventsOn(eventName, callback);
  }
  return undefined;
};

export const EventsOff = (eventName: string): void => {
  if (typeof window !== 'undefined' && window.runtime) {
    window.runtime.EventsOff(eventName);
  }
};
