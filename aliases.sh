#!/bin/sh
cd usvg
[ -L emoji_u1f1e7_1f1fb.svg ] || ln -s emoji_u1f1f3_1f1f4.svg emoji_u1f1e7_1f1fb.svg # BV -> NO
[ -L emoji_u1f1e8_1f1f5.svg ] || ln -s emoji_u1f1eb_1f1f7.svg emoji_u1f1e8_1f1f5.svg # CP -> FR
[ -L emoji_u1f1e9_1f1ec.svg ] || ln -s emoji_u1f1ee_1f1f4.svg emoji_u1f1e9_1f1ec.svg # DG -> IO
[ -L emoji_u1f1ea_1f1e6.svg ] || ln -s emoji_u1f1ea_1f1f8.svg emoji_u1f1ea_1f1e6.svg # EA -> ES
[ -L emoji_u1f1ed_1f1f2.svg ] || ln -s emoji_u1f1e6_1f1fa.svg emoji_u1f1ed_1f1f2.svg # HM -> AU
[ -L emoji_u1f1f2_1f1eb.svg ] || ln -s emoji_u1f1eb_1f1f7.svg emoji_u1f1f2_1f1eb.svg # MF -> FR
[ -L emoji_u1f1f8_1f1ef.svg ] || ln -s emoji_u1f1f3_1f1f4.svg emoji_u1f1f8_1f1ef.svg # SJ -> NO
[ -L emoji_u1f1fa_1f1f2.svg ] || ln -s emoji_u1f1fa_1f1f8.svg emoji_u1f1fa_1f1f2.svg # UM -> US

# [ -e emoji_u1f1e6_1f1e8.svg ] || ~/.cargo/bin/usvg ../special/emoji_u1f1e6_1f1e8.svg emoji_u1f1e6_1f1e8.svg
# [ -e emoji_u1f1f9_1f1e6.svg ] || ~/.cargo/bin/usvg ../special/emoji_u1f1f9_1f1e6.svg emoji_u1f1f9_1f1e6.svg
# [ -e emoji_u1f1e8_1f1f6.svg ] || ~/.cargo/bin/usvg ../special/emoji_u1f1e8_1f1f6.svg emoji_u1f1e8_1f1f6.svg
