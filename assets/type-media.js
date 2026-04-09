export const TYPE_MEDIA = {
  "CTRL": {
    slug: "ctrl",
    image: "/assets/type-images/CTRL.png"
  },
  "ATM-er": {
    slug: "atm-er",
    image: "/assets/type-images/ATM-er.png"
  },
  "Dior-s": {
    slug: "dior-s",
    image: "/assets/type-images/Dior-s.jpg"
  },
  "BOSS": {
    slug: "boss",
    image: "/assets/type-images/BOSS.png"
  },
  "THAN-K": {
    slug: "than-k",
    image: "/assets/type-images/THAN-K.png"
  },
  "OH-NO": {
    slug: "oh-no",
    image: "/assets/type-images/OH-NO.png"
  },
  "GOGO": {
    slug: "gogo",
    image: "/assets/type-images/GOGO.png"
  },
  "SEXY": {
    slug: "sexy",
    image: "/assets/type-images/SEXY.png"
  },
  "LOVE-R": {
    slug: "love-r",
    image: "/assets/type-images/LOVE-R.png"
  },
  "MUM": {
    slug: "mum",
    image: "/assets/type-images/MUM.png"
  },
  "FAKE": {
    slug: "fake",
    image: "/assets/type-images/FAKE.png"
  },
  "OJBK": {
    slug: "ojbk",
    image: "/assets/type-images/OJBK.png"
  },
  "MALO": {
    slug: "malo",
    image: "/assets/type-images/MALO.png"
  },
  "JOKE-R": {
    slug: "joke-r",
    image: "/assets/type-images/JOKE-R.jpg"
  },
  "WOC!": {
    slug: "woc",
    image: "/assets/type-images/WOC.png"
  },
  "THIN-K": {
    slug: "thin-k",
    image: "/assets/type-images/THIN-K.png"
  },
  "SHIT": {
    slug: "shit",
    image: "/assets/type-images/SHIT.png"
  },
  "ZZZZ": {
    slug: "zzzz",
    image: "/assets/type-images/ZZZZ.png"
  },
  "POOR": {
    slug: "poor",
    image: "/assets/type-images/POOR.png"
  },
  "MONK": {
    slug: "monk",
    image: "/assets/type-images/MONK.png"
  },
  "IMSB": {
    slug: "imsb",
    image: "/assets/type-images/IMSB.png"
  },
  "SOLO": {
    slug: "solo",
    image: "/assets/type-images/SOLO.png"
  },
  "FUCK": {
    slug: "fuck",
    image: "/assets/type-images/FUCK.png"
  },
  "DEAD": {
    slug: "dead",
    image: "/assets/type-images/DEAD.png"
  },
  "IMFW": {
    slug: "imfw",
    image: "/assets/type-images/IMFW.png"
  },
  "HHHH": {
    slug: "hhhh",
    image: "/assets/type-images/HHHH.png"
  },
  "DRUNK": {
    slug: "drunk",
    image: "/assets/type-images/DRUNK.png"
  }
};

export function getTypeSlug(code) {
  return TYPE_MEDIA[code]?.slug ?? code.toLowerCase();
}

export function getTypeImage(code) {
  return TYPE_MEDIA[code]?.image ?? "";
}

export function getTypeHref(code) {
  return `/types/#${getTypeSlug(code)}`;
}
