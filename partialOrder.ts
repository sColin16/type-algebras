export type PartialOrder<T> = {
  isSubtype: (t1: T, t2: T) => boolean;
  isStrictSubtype: (t1: T, t2: T) => boolean;
  isSupertype: (t1: T, t2: T) => boolean;
  isStrictSupertype: (t1: T, t2: T) => boolean;
  isEqual: (t1: T, t2: T) => boolean;
  isUnrelated: (t1: T, t2: T) => boolean;
};

export const buildPartialOrder = <T>(
  isSubtype: (t1: T, t2: T) => boolean
): PartialOrder<T> => {
  const isSupertype = (t1: T, t2: T) => isSubtype(t2, t1);
  const isEqual = (t1: T, t2: T) => isSubtype(t1, t2) && isSupertype(t1, t2);
  const isStrictSubtype = (t1: T, t2: T) =>
    isSubtype(t1, t2) && !isSupertype(t1, t2);
  const isStrictSupertype = (t1: T, t2: T) =>
    !isSubtype(t1, t2) && isSupertype(t1, t2);
  const isUnrelated = (t1: T, t2: T) =>
    !isSubtype(t1, t2) && !isSupertype(t1, t2);

  return {
    isSubtype,
    isStrictSubtype,
    isSupertype,
    isStrictSupertype,
    isEqual,
    isUnrelated,
  };
};
