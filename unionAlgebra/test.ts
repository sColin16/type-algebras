import { l, a, b, unionRec, mu, Var, union } from "./external";
import { unfold } from "./internal";
import { internalize, internalizeMu } from "./internalize";
import { is } from "immutable";
import * as External from "./external";
import { partialOrder } from "./subtype";

const {
  isStrictSubtype: isStrictSubtypeFn,
  isEqual: isEqualFn,
  isUnrelated: isUnrelatedFn,
} = partialOrder;

const range = (lower: number, upper: number) => {
  let nums = Array.from(new Array(upper - lower + 1), (x, i) => i + lower);
  return externalListUnion(nums.map((num) => External.l(num)));
};

const externalListUnion = (
  types: Array<External.TreeType>
): External.TreeType => {
  if (types.length === 0) {
    throw Error("Cannot create list union with empty list");
  }
  if (types.length === 1) {
    return types[0];
  }

  return union(types[0], externalListUnion(types.slice(1)));
};

const unfoldsTo = (t1: External.MuNode, t2: External.TreeType) => {
  return expect(is(internalize(t2), unfold(internalizeMu(t1)))).toBe(true);
};

const isStrictSubtype = (t1: External.TreeType, t2: External.TreeType) => {
  return expect(isStrictSubtypeFn(t1, t2)).toBe(true);
};

const isEqual = (t1: External.TreeType, t2: External.TreeType) => {
  return expect(isEqualFn(t1, t2)).toBe(true);
};

const isNotEqual = (t1: External.TreeType, t2: External.TreeType) => {
  return expect(isEqualFn(t1, t2)).toBe(false);
};

const isUnrelated = (t1: External.TreeType, t2: External.TreeType) => {
  return expect(isUnrelatedFn(t1, t2)).toBe(true);
};

describe("Unfold recursive types", () => {
  test("Unfold basic inductive type A", () => {
    unfoldsTo(
      mu(unionRec(l(1), a(Var(0)))),
      union(l(1), a(mu(unionRec(l(1), a(Var(0))))))
    );
  });

  test("Unfold basic inductive type B", () => {
    unfoldsTo(
      mu(b(Var(0), Var(0))),
      b(mu(b(Var(0), Var(0))), mu(b(Var(0), Var(0))))
    );
  });

  test("Unfold nested inductive type A", () => {
    unfoldsTo(
      mu(
        unionRec(
          l(1),
          unionRec(a(Var(0)), mu(unionRec(l(1), b(Var(0), Var(1)))))
        )
      ),
      union(
        l(1),
        union(
          a(
            mu(
              unionRec(
                l(1),
                unionRec(a(Var(0)), mu(unionRec(l(1), b(Var(0), Var(1)))))
              )
            )
          ),
          mu(
            unionRec(
              l(1),
              b(
                Var(0),
                mu(
                  unionRec(
                    l(1),
                    unionRec(a(Var(0)), mu(unionRec(l(1), b(Var(0), Var(1)))))
                  )
                )
              )
            )
          )
        )
      )
    );
  });

  test("Unfold nested inductive type B", () => {
    unfoldsTo(
      mu(b(Var(0), mu(b(Var(0), Var(1))))),
      b(
        mu(b(Var(0), mu(b(Var(0), Var(1))))),
        mu(b(Var(0), mu(b(Var(0), mu(b(Var(0), Var(1)))))))
      )
    );
  });

  test("Unfold with free variable", () => {
    unfoldsTo(
      mu(unionRec(mu(b(Var(0), Var(1))), a(Var(2)))),
      union(
        mu(b(Var(0), mu(unionRec(mu(b(Var(0), Var(1))), a(Var(3)))))),
        a(Var(1))
      )
    );
  });
});

describe("Non-recursive subtyping", () => {
  test("Identical labels are equal", () => {
    isEqual(l(1), l(1));
  });

  test("Different labels are unrelated", () => {
    isUnrelated(l(1), l(2));
  });

  test("Identical unary tree are equal", () => {
    isEqual(a(l(1)), a(l(1)));
  });

  test("Different unary trees are unrelated", () => {
    isUnrelated(a(l(1)), a(a(l(1))));
  });

  test("Identical binary trees are equal", () => {
    isEqual(b(l(1), l(2)), b(l(1), l(2)));
  });

  test("Different binary trees are unrelated", () => {
    isUnrelated(b(l(2), l(1)), b(l(1), l(2)));
  });

  test("Basic union is commutative", () => {
    isEqual(union(l(1), l(2)), union(l(2), l(1)));
  });

  test("Basic union is associative", () => {
    isEqual(union(union(l(1), l(2)), l(3)), union(l(1), union(l(2), l(3))));
  });

  test("Union type expansion holds", () => {
    isStrictSubtype(l(1), union(l(1), l(2)));
  });

  test("Unary tree splitting is equivalent", () => {
    isEqual(a(union(l(1), l(2))), union(a(l(1)), a(l(2))));
  });

  test("Left binary tree splitting is equivalent", () => {
    isEqual(b(union(l(1), l(2)), l(3)), union(b(l(1), l(3)), b(l(2), l(3))));
  });

  test("Right binary tree splitting is equivalent", () => {
    isEqual(b(l(1), union(l(2), l(3))), union(b(l(1), l(2)), b(l(1), l(3))));
  });

  test("Simultaneous binary tree splitting is not equivalent", () => {
    isNotEqual(
      b(union(l(1), l(2)), union(l(3), l(4))),
      union(b(l(1), l(3)), b(l(2), l(4)))
    );
  });

  test("Identical ranges are equal", () => {
    isEqual(range(1, 100), range(1, 100));
  });

  test("Sub ranges are strict subtype", () => {
    isStrictSubtype(range(20, 80), range(1, 100));
  });

  // THis doesn't subtype 1000 ranges as quickly as OCaml
  test("Large split binary trees are equal", () => {
    isEqual(
      b(range(1, 100), range(1, 100)),
      union(
        union(b(range(1, 80), range(1, 80)), b(range(81, 100), range(1, 100))),
        b(range(1, 80), range(81, 100))
      )
    );
  });

  test("Very large bested binary trees are equal", () => {
    isEqual(
      b(b(range(1, 100), range(1, 100)), b(range(1, 100), range(1, 100))),
      b(
        union(
          union(b(range(1, 50), range(1, 50)), b(range(51, 100), range(1, 50))),
          union(
            b(range(1, 50), range(51, 100)),
            b(range(51, 100), range(51, 100))
          )
        ),
        union(
          union(
            b(range(1, 25), range(1, 75)),
            b(range(10, 100), range(50, 100))
          ),
          union(
            b(range(1, 30), range(70, 100)),
            b(range(20, 100), range(1, 80))
          )
        )
      )
    );
  });
});

describe("Recurive subtyping", () => {
  test("Inductive even subtype of inductive numbers", () => {
    isStrictSubtype(
      mu(unionRec(l(1), a(a(Var(0))))),
      mu(unionRec(l(1), a(Var(0))))
    );
  });

  test("Coinductive double equal to coinductive singles", () => {
    isEqual(mu(a(a(Var(0)))), mu(a(Var(0))));
  });

  test("Base case is subtype of inductive type", () => {
    isStrictSubtype(l(1), mu(unionRec(l(1), a(Var(0)))));
  });

  test("Union of numbers subset of natural numbers", () => {
    isStrictSubtype(
      union(
        union(l(1), a(a(a(l(1))))),
        union(a(a(l(1))), a(a(a(a(a(a(l(1))))))))
      ),
      mu(unionRec(l(1), a(Var(0))))
    );
  });

  test("Unfolded type equal to original A", () => {
    isEqual(
      mu(unionRec(l(1), a(Var(0)))),
      union(l(1), a(mu(unionRec(l(1), a(Var(0))))))
    );
  });

  test("Unfolded type equal to original B", () => {
    isEqual(
      mu(unionRec(l(1), a(Var(0)))),
      union(l(1), mu(unionRec(a(l(1)), a(Var(0)))))
    );
  });

  test("Even or odd equal to natural numbers", () => {
    isEqual(
      mu(unionRec(l(1), a(Var(0)))),
      union(
        mu(unionRec(a(l(1)), a(a(Var(0))))),
        mu(unionRec(l(1), a(a(Var(0)))))
      )
    );
  });

  test("Split binary inductive types equal", () => {
    isEqual(
      b(mu(unionRec(l(1), a(Var(0)))), mu(unionRec(l(1), a(Var(0))))),
      union(
        union(
          b(mu(unionRec(l(1), a(a(Var(0))))), mu(unionRec(l(1), a(a(Var(0)))))),
          b(
            mu(unionRec(a(l(1)), a(a(Var(0))))),
            mu(unionRec(a(l(1)), a(a(Var(0)))))
          )
        ),
        union(
          b(
            mu(unionRec(a(l(1)), a(a(Var(0))))),
            mu(unionRec(l(1), a(a(Var(0)))))
          ),
          b(
            mu(unionRec(l(1), a(a(Var(0))))),
            mu(unionRec(a(l(1)), a(a(Var(0)))))
          )
        )
      )
    );
  });

  test("Forbenius 3,5 equal to generated sequence", () => {
    isEqual(
      mu(unionRec(l(1), unionRec(a(a(a(Var(0)))), a(a(a(a(a(Var(0))))))))),
      union(
        union(a(a(a(l(1)))), a(a(a(a(a(l(1))))))),
        union(
          union(l(1), a(a(a(a(a(a(l(1)))))))),
          mu(unionRec(a(a(a(a(a(a(a(a(l(1))))))))), a(Var(0))))
        )
      )
    );
  });

  test("Nested coinductive types are equal A", () => {
    isEqual(mu(b(Var(0), mu(b(Var(0), Var(1))))), mu(b(Var(0), Var(0))));
  });

  test("Nested coinductive types are equal B", () => {
    isEqual(mu(b(Var(0), mu(b(Var(1), Var(0))))), mu(b(Var(0), Var(0))));
  });

  test("Different period coinductive variables are equal", () => {
    isEqual(mu(a(a(a(Var(0))))), mu(a(a(Var(0)))));
  });

  test("Mirrored structure coinductive tpyes are equivalent", () => {
    isEqual(mu(b(Var(0), mu(mu(b(Var(0), Var(1)))))), mu(b(Var(0), Var(0))));
  });

  test("Coinductive stream unfolded is equivalent", () => {
    isEqual(
      mu(mu(unionRec(b(Var(0), Var(0)), a(Var(1))))),
      mu(
        unionRec(
          b(Var(0), Var(0)),
          a(mu(mu(unionRec(b(Var(0), Var(0)), a(Var(1))))))
        )
      )
    );
  });

  test("Prefixed coinductive types are equal", () => {
    isEqual(mu(a(Var(0))), a(a(mu(a(Var(0))))));
  });

  test("Off-sync coinductive types are equal", () => {
    isEqual(mu(a(b(Var(0), Var(0)))), a(mu(b(a(Var(0)), a(Var(0))))));
  });

  test("Coinductive type without labels is strict subtype", () => {
    isStrictSubtype(
      mu(a(Var(0))),
      mu(a(union(union(l(1), Var(0)), mu(a(Var(0))))))
    );
  });

  test("Dummy coinductive variable retains equality", () => {
    isEqual(
      mu(a(union(l(1), b(Var(0), Var(0))))),
      mu(a(mu(unionRec(l(1), b(Var(1), Var(1))))))
    );
  });

  test("Random coinductive types are subtypes", () => {
    isStrictSubtype(
      mu(a(b(Var(0), Var(0)))),
      a(
        mu(
          unionRec(
            b(
              mu(unionRec(a(Var(0)), b(Var(0), Var(0)))),
              mu(unionRec(a(Var(0)), b(Var(0), Var(0))))
            ),
            b(a(Var(0)), a(Var(0)))
          )
        )
      )
    );
  });

  test("Finite branch of coinductive stream is subtype", () => {
    isStrictSubtype(
      mu(a(a(a(a(b(Var(0), Var(0))))))),
      mu(unionRec(a(Var(0)), mu(b(Var(1), Var(1)))))
    );
  });

  test("Inverted finite branch of coinductive stream is subtype", () => {
    isStrictSubtype(
      mu(b(a(a(Var(0))), a(a(Var(0))))),
      mu(mu(unionRec(a(Var(0)), b(Var(1), Var(1)))))
    );
  });

  test("Even branch of coinductive stream is subtype", () => {
    isStrictSubtype(
      mu(unionRec(a(a(Var(0))), mu(b(Var(1), Var(1))))),
      mu(unionRec(a(Var(0)), mu(b(Var(1), Var(1)))))
    );
  });

  test("Split coinductive type is a strict subtype", () => {
    isStrictSubtype(
      union(mu(a(Var(0))), mu(b(Var(0), Var(0)))),
      mu(unionRec(a(Var(0)), b(Var(0), Var(0))))
    );
  });

  test("Nested coinductive variables equal", () => {
    isEqual(mu(a(b(Var(0), Var(0)))), mu(a(mu(b(Var(1), a(Var(0)))))));
  });

  // The third branch of the RHS union is inductive, the others are base cases
  test("Inductive type in base case/inductive form equal", () => {
    isEqual(
      mu(
        unionRec(l(1), mu(unionRec(l(2), unionRec(a(Var(1)), b(l(3), Var(0))))))
      ),
      mu(
        unionRec(
          l(1),
          unionRec(
            mu(unionRec(l(2), b(l(3), Var(0)))),
            mu(unionRec(a(Var(1)), b(l(3), Var(0))))
          )
        )
      )
    );
  });

  test("Fixed sequence subtype of sequence components", () => {
    isStrictSubtype(
      mu(unionRec(mu(a(b(l(1), Var(0)))), b(l(2), Var(0)))),
      mu(unionRec(mu(unionRec(a(Var(0)), b(l(1), Var(0)))), b(l(2), Var(0))))
    );
  });

  test("Coinductive union unfolding equal", () => {
    isEqual(
      mu(unionRec(a(Var(0)), b(l(1), Var(0)))),
      union(
        a(mu(unionRec(a(Var(0)), b(l(1), Var(0))))),
        b(l(1), mu(unionRec(a(Var(0)), b(l(1), Var(0)))))
      )
    );
  });

  test("Mirrored structure equality", () => {
    isEqual(
      mu(b(Var(0), a(Var(0)))),
      mu(b(Var(0), mu(a(mu(b(Var(0), Var(1)))))))
    );
  });
});
