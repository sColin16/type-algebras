import * as External from "./external";
import { l, a, b, union, inter, top, bottom } from "./external";
import { partialOrder } from "./subtype";

const {
  isStrictSubtype: isStrictSubtypeFn,
  isStrictSupertype: isStrictSupertypeFn,
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

const isStrictSubtype = (t1: External.TreeType, t2: External.TreeType) => {
  return expect(isStrictSubtypeFn(t1, t2)).toBe(true);
};

const isStrictSupertype = (t1: External.TreeType, t2: External.TreeType) => {
  return expect(isStrictSupertypeFn(t1, t2)).toBe(true);
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

describe("Tree subtyping", () => {
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

  test("Unary tree nested subtyping holds", () => {
    isStrictSubtype(a(l(1)), a(union(l(1), l(2))));
  });

  test("Binary tree left node nested subtyping holds", () => {
    isStrictSubtype(b(l(1), l(2)), b(union(l(1), l(3)), l(2)));
  });

  test("Binary tree right node nested subtyping holds", () => {
    isStrictSubtype(b(l(1), l(2)), b(l(1), union(l(2), l(3))));
  });

  test("Binary tree dual node nested subtyping holds", () => {
    isStrictSubtype(b(l(1), l(2)), b(union(l(1), l(3)), union(l(2), l(4))));
  });
});

describe("Top/bottom subtyping", () => {
  test("Top is equivalent to self", () => {
    isEqual(top(), top());
  });

  test("Bottom is equivalent to self", () => {
    isEqual(bottom(), bottom());
  });

  test("Top is strict supertype of example type", () => {
    isStrictSupertype(top(), a(b(l(1), union(l(2), l(3)))));
  });

  test("Bottom is strict subtype of example type", () => {
    isStrictSubtype(bottom(), a(b(l(1), union(l(2), l(3)))));
  });

  test("Nested bottom type in unary is bottom type", () => {
    isEqual(bottom(), a(a(bottom())));
  });

  test("Nested bottom type in left binary node is bottom type", () => {
    isEqual(bottom(), b(bottom(), l(1)));
  });

  test("Nested bottom type in right binary node is bottom type", () => {
    isEqual(bottom(), b(l(1), bottom()));
  });

  test("Nested top type is strict supertype", () => {
    isStrictSupertype(a(top()), a(b(l(1), l(2))));
  });
});

describe("Union subtyping", () => {
  test("Basic union is commutative", () => {
    isEqual(union(l(1), l(2)), union(l(2), l(1)));
  });

  test("Basic union is associative", () => {
    isEqual(union(union(l(1), l(2)), l(3)), union(l(1), union(l(2), l(3))));
  });

  test("Union is structurally idempotent", () => {
    isEqual(union(l(1), l(1)), l(1));
  });

  test("Union is algebraically idempotent", () => {
    isEqual(
      a(union(l(1), l(2))),
      union(a(union(l(1), l(2))), union(a(l(1)), a(l(2))))
    );
  });

  test("Top in union subsumes entire type", () => {
    isEqual(top(), union(union(l(1), l(2)), union(top(), l(3))));
  });

  test("Bottom in union has no effect", () => {
    isEqual(l(1), union(union(l(1), bottom()), bottom()));
  });

  test("Union type expansion holds", () => {
    isStrictSubtype(l(1), union(l(1), l(2)));
  });

  test("Union distributes through unary tree", () => {
    isEqual(a(union(l(1), l(2))), union(a(l(1)), a(l(2))));
  });

  test("Union distributes through left binary tree child", () => {
    isEqual(b(union(l(1), l(2)), l(3)), union(b(l(1), l(3)), b(l(2), l(3))));
  });

  test("Union distributes through right binary tree child", () => {
    isEqual(b(l(1), union(l(2), l(3))), union(b(l(1), l(2)), b(l(1), l(3))));
  });

  test("Union does not distribute simultaneously through both binary tree children", () => {
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

  test("Split unary trees are equal", () => {
    isEqual(
      a(range(1, 10)),
      union(
        union(a(range(1, 3)), a(range(4, 5))),
        union(a(range(6, 7)), a(range(8, 10)))
      )
    );
  });

  test("Split binary trees are equal", () => {
    isEqual(
      b(range(1, 10), range(1, 10)),
      union(
        union(b(range(1, 8), range(1, 8)), b(range(9, 10), range(1, 10))),
        b(range(1, 8), range(9, 10))
      )
    );
  });

  test("Union of subtype is the supertype", () => {
    isEqual(
      union(a(union(l(1), l(2))), l(3)),
      union(a(l(1)), union(a(union(l(1), l(2))), l(3)))
    );
  });
});

describe("Intersection subtyping", () => {
  test("Basic intersection is commutative", () => {
    isEqual(
      inter(union(l(1), l(2)), union(l(2), l(3))),
      inter(union(l(2), l(3)), union(l(1), l(2)))
    );
  });

  test("Basic intersection is associative", () => {
    isEqual(
      inter(
        inter(union(union(l(1), l(2)), l(3)), union(union(l(2), l(3)), l(4))),
        union(union(l(3), l(4)), l(5))
      ),
      inter(
        union(union(l(1), l(2)), l(3)),
        inter(union(union(l(2), l(3)), l(4)), union(union(l(3), l(4)), l(5)))
      )
    );
  });

  test("Intersection is structurally idempotent", () => {
    isEqual(l(1), inter(l(1), l(1)));
  });

  test("Intersection is algebraically idempotent", () => {
    isEqual(
      union(a(l(1)), a(l(2))),
      inter(a(union(l(1), l(2))), union(a(l(1)), a(l(2))))
    );
  });

  test("Top in intersection has no effect", () => {
    isEqual(l(1), inter(top(), inter(l(1), top())));
  });

  test("Bottom in intersection subsumes entire type", () => {
    isEqual(
      bottom(),
      inter(union(l(1), l(2)), inter(bottom(), union(l(2), l(3))))
    );
  });

  test("Intersection type restriction holds", () => {
    isStrictSubtype(inter(union(l(1), l(2)), l(1)), union(l(1), l(2)));
  });

  test("Intersection distributes through unary tree", () => {
    isEqual(
      inter(a(union(l(1), l(2))), a(union(l(2), l(3)))),
      a(inter(union(l(1), l(2)), union(l(2), l(3))))
    );
  });

  test("Intersection distributes through left binary node", () => {
    isEqual(
      inter(b(union(l(1), l(2)), l(1)), b(union(l(2), l(3)), l(1))),
      b(inter(union(l(1), l(2)), union(l(2), l(3))), l(1))
    );
  });

  test("Intersection distributes through right binary node", () => {
    isEqual(
      inter(b(l(1), union(l(1), l(2))), b(l(1), union(l(2), l(3)))),
      b(l(1), inter(union(l(1), l(2)), union(l(2), l(3))))
    );
  });

  test("Intersection distributes simultaneously through both nodes", () => {
    isEqual(
      inter(
        b(union(l(1), l(2)), union(l(1), l(2))),
        b(union(l(2), l(3)), union(l(2), l(3)))
      ),
      b(
        inter(union(l(1), l(2)), union(l(2), l(3))),
        inter(union(l(1), l(2)), union(l(2), l(3)))
      )
    );
  });

  test("Multi-unary node intersection distributes", () => {
    isEqual(
      inter(
        inter(
          a(union(union(l(1), l(2)), l(3))),
          a(union(union(l(2), l(3)), l(4)))
        ),
        a(union(union(l(3), l(4)), l(5)))
      ),
      a(
        inter(
          inter(union(union(l(1), l(2)), l(3)), union(union(l(2), l(3)), l(4))),
          union(union(l(3), l(4)), l(5))
        )
      )
    );
  });

  test("Mult-binary node intersection distributes", () => {
    isEqual(
      inter(
        inter(
          b(union(union(l(1), l(2)), l(3)), union(union(l(1), l(2)), l(3))),
          b(union(union(l(2), l(3)), l(4)), union(union(l(2), l(3)), l(4)))
        ),
        b(union(union(l(3), l(4)), l(5)), union(union(l(3), l(4)), l(5)))
      ),
      b(
        inter(
          inter(union(union(l(1), l(2)), l(3)), union(union(l(2), l(3)), l(4))),
          union(union(l(3), l(4)), l(5))
        ),
        inter(
          inter(union(union(l(1), l(2)), l(3)), union(union(l(2), l(3)), l(4))),
          union(union(l(3), l(4)), l(5))
        )
      )
    );
  });

  // This confirms that we correctly check n-ary intersections
  test("N-ary intersection with pairwise intersections is bottom type", () => {
    isEqual(
      bottom(),
      inter(inter(union(l(1), l(2)), union(l(2), l(3))), union(l(3), l(1)))
    );
  });

  test("Intersection of mismatched labels is bottom type", () => {
    isEqual(bottom(), inter(l(1), l(2)));
  });

  test("Intersection of mismatched unary nodes is bottom type", () => {
    isEqual(bottom(), inter(a(l(1)), a(l(2))));
  });

  test("Intersection of mismatched binary nodes is bottom type", () => {
    isEqual(bottom(), inter(b(l(2), l(1)), b(l(3), l(1))));
  });

  test("Nested intersection of mismatched nodes is bottom type", () => {
    isEqual(bottom(), inter(a(a(l(1))), a(a(l(2)))));
  });

  test("Intersection of L/A nodes is bottom type", () => {
    isEqual(bottom(), inter(l(1), a(l(1))));
  });

  test("Intersection of L/B nodes is bottom type", () => {
    isEqual(bottom(), inter(l(1), b(l(1), l(1))));
  });

  test("Intersection of A/B nodes is bottom type", () => {
    isEqual(bottom(), inter(a(l(1)), b(l(1), l(1))));
  });

  test("Binary intersection of l node union is correct", () => {
    isEqual(l(2), inter(union(l(1), l(2)), union(l(2), l(3))));
  });

  test("Multiple intersection of l node union is correct", () => {
    isEqual(
      l(3),
      inter(
        inter(union(union(l(1), l(2)), l(3)), union(union(l(2), l(3)), l(4))),
        union(union(l(3), l(4)), l(5))
      )
    );
  });

  test("Binary intersection of a nodes is correct", () => {
    isEqual(inter(a(union(l(1), l(2))), a(union(l(2), l(3)))), a(l(2)));
  });

  test("Multiple intersection of a nodes is correct", () => {
    isEqual(
      inter(
        inter(
          a(union(union(l(1), l(2)), l(3))),
          a(union(union(l(2), l(3)), l(4)))
        ),
        a(union(union(l(3), l(4)), l(5)))
      ),
      a(l(3))
    );
  });

  test("Binary intersection of b nodes is correct", () => {
    isEqual(
      inter(
        b(union(l(1), l(2)), union(l(1), l(2))),
        b(union(l(2), l(3)), union(l(2), l(3)))
      ),
      b(l(2), l(2))
    );
  });

  test("Multiple intersection of b nodes is correct", () => {
    isEqual(
      inter(
        inter(
          b(union(union(l(1), l(2)), l(3)), union(union(l(1), l(2)), l(3))),
          b(union(union(l(2), l(3)), l(4)), union(union(l(2), l(3)), l(4)))
        ),
        b(union(union(l(3), l(4)), l(5)), union(union(l(3), l(4)), l(5)))
      ),
      b(l(3), l(3))
    );
  });

  test("Intersection of subtypes is the subtype", () => {
    isEqual(a(l(1)), inter(a(l(1)), union(a(union(l(1), l(2))), l(3))));
  });
});

describe("Union/Intersection subtyping", () => {
  test("Union distributtes over intersection", () => {
    isEqual(
      union(l(1), inter(union(l(1), l(2)), union(l(2), l(3)))),
      inter(union(l(1), union(l(1), l(2))), union(l(1), union(l(2), l(3))))
    );
  });

  test("Intersection distributes over union", () => {
    isEqual(
      inter(l(1), union(l(1), l(2))),
      union(inter(l(1), l(1)), inter(l(1), l(2)))
    );
  });

  test("Intersection of union for mismatched nodes", () => {
    isEqual(
      inter(union(l(1), a(union(l(1), l(2)))), union(b(l(1), l(1)), a(l(2)))),
      a(l(2))
    );
  });

  test("Absorption law 1", () => {
    isEqual(
      union(l(1), l(2)),
      union(union(l(1), l(2)), inter(union(l(1), l(2)), union(l(2), l(3))))
    );
  });

  test("Absorption law 2", () => {
    isEqual(
      union(l(1), l(2)),
      inter(union(l(1), l(2)), union(union(l(1), l(2)), union(l(2), l(3))))
    );
  });

  test("Depply nested union/intersection", () => {
    isEqual(
      union(a(l(2)), b(l(3), l(4))),
      union(
        inter(
          union(l(1), a(union(l(2), b(l(2), l(2))))),
          union(a(inter(union(l(2), l(3)), l(2))), b(l(1), l(1)))
        ),
        inter(
          union(l(4), b(l(3), union(l(4), l(5)))),
          union(l(6), b(union(l(3), a(l(1))), l(4)))
        )
      )
    );
  });
});
