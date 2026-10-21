import { forwardRef, useImperativeHandle, useRef } from "react";
import {
  SCENE_W,
  SCENE_H,
  PRIYAMUDAN_STROKES,
  VIJAY_STROKES,
  PRIYAMUDAN_INK,
  VIJAY_INK,
  PRIYAMUDAN_X,
  VIJAY_X,
  FLOURISH_PATHS,
  UNDERLINE_PATH,
  SPARK_PATHS,
  RED_HEARTS,
  EXTRA_LINES,
  LEAVES,
  BLACK_HEART,
} from "./priyaScript";

export interface GlassTypographyHandle {
  nameEl: HTMLElement | null;
  tamilEl: HTMLElement | null;
}

interface Props {
  stage: "hidden" | "hi" | "letters" | "assemble" | "name" | "tamil" | "push";
}

const HI_TEXT = "INITIALIZING";

// "Welcome Aboard." traced from the Great Vibes cursive font (one path)
const NAME_PATH =
  "M518 125Q488 125 468 103Q449 81 453 20Q457 -43 492 -142Q527 -241 583 -375Q601 -418 620 -471Q638 -524 651 -578Q664 -631 664 -674Q664 -704 656 -726Q649 -749 630 -760Q608 -774 583 -780Q558 -786 530 -786Q467 -786 398 -757Q328 -728 264 -678Q199 -627 148 -563Q98 -499 72 -430Q57 -389 50 -353Q43 -317 43 -288Q43 -233 64 -196Q84 -160 118 -142Q151 -125 190 -125Q227 -125 260 -138Q303 -154 337 -192Q371 -230 391 -276Q411 -323 411 -362Q411 -396 394 -419Q376 -442 336 -442Q330 -442 324 -442Q319 -442 312 -440Q308 -439 305 -439Q302 -439 300 -439Q291 -439 291 -443Q291 -449 310 -456Q341 -466 368 -466Q415 -466 438 -438Q461 -411 461 -369Q461 -327 438 -278Q415 -230 370 -186Q326 -142 259 -114Q223 -99 185 -99Q133 -99 87 -126Q41 -153 12 -203Q-17 -253 -17 -321Q-17 -354 -9 -390Q-1 -426 16 -466Q49 -543 106 -606Q163 -670 234 -716Q304 -763 378 -788Q452 -813 519 -813Q578 -813 626 -792Q679 -769 700 -726Q722 -684 722 -631Q722 -573 702 -508Q683 -442 655 -379Q624 -308 594 -231Q564 -154 542 -85Q520 -16 511 30Q509 41 508 50Q507 58 507 64Q507 99 530 99Q544 99 563 87Q600 65 638 21Q676 -23 714 -80Q751 -136 786 -196Q821 -255 853 -308Q885 -361 911 -398Q927 -420 941 -430Q955 -441 965 -441Q986 -441 986 -409Q986 -390 977 -363Q964 -325 942 -276Q920 -228 901 -178Q882 -129 876 -86Q875 -75 874 -66Q874 -58 874 -49Q874 3 895 26Q916 48 950 48Q989 48 1038 23Q1088 -2 1138 -44Q1188 -85 1228 -135Q1269 -185 1290 -235Q1313 -290 1325 -342Q1337 -394 1337 -437Q1337 -506 1307 -550Q1277 -593 1213 -593Q1208 -593 1202 -592Q1196 -592 1189 -591Q1165 -585 1154 -585Q1141 -585 1141 -591Q1141 -599 1161 -609Q1181 -619 1203 -615Q1251 -619 1294 -594Q1336 -568 1362 -518Q1388 -467 1388 -395Q1388 -358 1380 -315Q1372 -272 1353 -225Q1328 -162 1283 -108Q1238 -54 1182 -13Q1127 28 1070 50Q1012 73 962 73Q905 73 866 38Q828 2 828 -77Q828 -110 834 -144Q840 -178 848 -204Q831 -176 803 -134Q775 -93 740 -48Q704 -3 666 36Q628 76 590 100Q552 125 518 125ZM1482 4Q1445 4 1416 -20Q1386 -44 1386 -93Q1386 -134 1404 -180Q1423 -226 1454 -266Q1484 -307 1522 -332Q1559 -358 1597 -358Q1616 -358 1634 -347Q1652 -336 1652 -309Q1652 -284 1633 -254Q1614 -224 1579 -198Q1564 -187 1541 -177Q1518 -167 1495 -160Q1472 -154 1457 -154Q1452 -142 1448 -122Q1443 -102 1443 -81Q1443 -56 1453 -36Q1463 -16 1490 -16Q1523 -16 1552 -35Q1580 -54 1602 -83Q1625 -112 1641 -142Q1657 -172 1666 -193Q1678 -193 1678 -184Q1665 -156 1648 -123Q1632 -90 1610 -62Q1587 -33 1556 -14Q1524 4 1482 4ZM1464 -172Q1478 -172 1511 -182Q1544 -193 1571 -216Q1597 -239 1611 -266Q1625 -294 1625 -313Q1625 -335 1609 -335Q1597 -335 1576 -319Q1555 -303 1524 -265Q1505 -241 1488 -213Q1471 -185 1464 -172ZM1713 3Q1676 3 1658 -20Q1641 -42 1641 -73Q1641 -105 1650 -139Q1659 -173 1666 -196Q1682 -252 1706 -316Q1731 -379 1760 -440Q1790 -502 1819 -551Q1842 -590 1868 -610Q1895 -629 1915 -629Q1931 -629 1940 -618Q1950 -606 1950 -583Q1950 -567 1944 -545Q1939 -523 1926 -495Q1891 -417 1842 -339Q1794 -261 1720 -193Q1708 -165 1700 -133Q1692 -101 1692 -81Q1692 -19 1734 -19Q1766 -19 1805 -66Q1844 -112 1879 -193Q1883 -193 1887 -192Q1891 -190 1891 -184Q1880 -157 1864 -124Q1847 -92 1826 -63Q1804 -34 1776 -16Q1748 3 1713 3ZM1728 -225Q1764 -262 1798 -310Q1832 -359 1862 -412Q1891 -464 1911 -511Q1918 -526 1922 -544Q1927 -562 1927 -574Q1927 -588 1920 -588Q1916 -588 1908 -580Q1900 -573 1887 -555Q1868 -530 1846 -487Q1823 -444 1800 -395Q1777 -346 1758 -300Q1739 -255 1728 -225ZM1965 4Q1910 4 1884 -25Q1857 -54 1857 -103Q1857 -126 1866 -156Q1875 -186 1890 -217Q1905 -248 1923 -272Q1952 -311 1987 -332Q2022 -354 2058 -354Q2096 -354 2112 -338Q2129 -321 2129 -299Q2129 -278 2119 -262Q2109 -245 2096 -235Q2084 -225 2075 -225Q2067 -225 2061 -231Q2069 -241 2078 -255Q2087 -269 2091 -282Q2095 -294 2095 -306Q2095 -332 2071 -332Q2042 -332 2014 -308Q1987 -284 1964 -246Q1942 -209 1928 -168Q1915 -126 1915 -91Q1915 -59 1928 -38Q1942 -17 1973 -17Q2014 -17 2045 -44Q2076 -70 2100 -110Q2124 -151 2142 -193Q2146 -193 2150 -192Q2154 -190 2154 -184Q2134 -134 2107 -91Q2080 -48 2046 -22Q2011 4 1965 4ZM2202 0Q2161 0 2142 -30Q2122 -59 2122 -101Q2122 -140 2137 -182Q2153 -228 2182 -266Q2210 -304 2244 -328Q2279 -351 2313 -351Q2354 -351 2374 -323Q2393 -295 2393 -252Q2393 -222 2383 -189Q2373 -156 2356 -124Q2369 -111 2393 -111Q2421 -111 2441 -129Q2461 -147 2480 -193Q2492 -193 2492 -184Q2473 -138 2448 -116Q2424 -95 2386 -96Q2363 -96 2348 -109Q2320 -63 2282 -32Q2243 0 2202 0ZM2216 -22Q2239 -22 2262 -42Q2285 -61 2304 -86Q2323 -111 2331 -129Q2315 -158 2312 -172Q2310 -187 2310 -194Q2310 -213 2320 -223Q2330 -233 2340 -233Q2354 -233 2364 -221Q2366 -232 2367 -242Q2368 -251 2368 -260Q2368 -286 2358 -302Q2349 -319 2329 -319Q2308 -319 2285 -301Q2262 -283 2242 -253Q2221 -223 2206 -186Q2193 -155 2186 -128Q2179 -100 2179 -77Q2179 -52 2188 -37Q2197 -22 2216 -22ZM2383 5Q2420 -66 2453 -138Q2486 -209 2520 -273Q2540 -309 2554 -324Q2567 -338 2590 -338Q2598 -338 2607 -336Q2616 -333 2625 -333Q2631 -333 2634 -334Q2620 -326 2598 -294Q2576 -263 2553 -222Q2530 -181 2512 -145Q2531 -168 2552 -191Q2572 -214 2597 -235Q2619 -254 2644 -276Q2668 -299 2692 -315Q2716 -331 2734 -331Q2741 -331 2743 -330Q2762 -322 2762 -304Q2762 -298 2757 -286Q2744 -252 2724 -216Q2703 -181 2685 -145Q2700 -163 2722 -189Q2745 -215 2768 -235Q2790 -255 2824 -277Q2858 -299 2891 -315Q2924 -331 2944 -331Q2951 -331 2954 -330Q2954 -330 2943 -310Q2932 -291 2916 -260Q2899 -228 2882 -192Q2865 -157 2852 -124Q2838 -92 2834 -70Q2831 -57 2831 -46Q2831 -30 2837 -25Q2843 -20 2850 -20Q2870 -20 2890 -37Q2909 -54 2928 -80Q2947 -107 2962 -137Q2978 -167 2989 -193Q3001 -193 3001 -184Q2990 -157 2974 -124Q2957 -92 2936 -63Q2915 -34 2890 -15Q2865 4 2836 4Q2815 4 2796 -10Q2778 -24 2778 -62Q2778 -103 2798 -144Q2817 -185 2838 -219Q2848 -236 2848 -246Q2848 -258 2836 -258Q2826 -258 2808 -248Q2791 -238 2765 -213Q2749 -198 2728 -172Q2706 -145 2684 -114Q2662 -83 2646 -53Q2630 -23 2625 0Q2610 0 2601 -12Q2592 -25 2592 -42Q2592 -45 2592 -48Q2592 -51 2593 -55Q2598 -86 2609 -108Q2620 -129 2634 -158Q2641 -171 2650 -188Q2659 -206 2666 -222Q2673 -239 2673 -250Q2673 -260 2665 -260Q2656 -260 2642 -251Q2627 -242 2614 -230Q2601 -219 2594 -213Q2569 -189 2534 -144Q2498 -99 2456 -16Q2450 -5 2442 -2Q2434 0 2417 0Q2406 0 2398 0Q2391 1 2383 5ZM3061 4Q3024 4 2994 -20Q2965 -44 2965 -93Q2965 -134 2984 -180Q3002 -226 3032 -266Q3063 -307 3100 -332Q3138 -358 3176 -358Q3195 -358 3213 -347Q3231 -336 3231 -309Q3231 -284 3212 -254Q3193 -224 3158 -198Q3143 -187 3120 -177Q3097 -167 3074 -160Q3051 -154 3036 -154Q3031 -142 3026 -122Q3022 -102 3022 -81Q3022 -56 3032 -36Q3042 -16 3069 -16Q3102 -16 3130 -35Q3159 -54 3182 -83Q3204 -112 3220 -142Q3236 -172 3245 -193Q3257 -193 3257 -184Q3244 -156 3228 -123Q3211 -90 3188 -62Q3166 -33 3134 -14Q3103 4 3061 4ZM3043 -172Q3057 -172 3090 -182Q3123 -193 3150 -216Q3176 -239 3190 -266Q3204 -294 3204 -313Q3204 -335 3188 -335Q3176 -335 3155 -319Q3134 -303 3103 -265Q3084 -241 3067 -213Q3050 -185 3043 -172ZM3902 64Q3858 64 3840 30Q3822 -5 3822 -51Q3822 -92 3834 -132Q3845 -172 3861 -193Q3834 -161 3794 -120Q3754 -79 3706 -41Q3658 -3 3607 22Q3556 47 3506 47Q3440 47 3408 5Q3375 -37 3375 -110Q3375 -167 3394 -232Q3414 -298 3452 -366Q3470 -399 3492 -432Q3515 -464 3541 -493Q3510 -508 3481 -526Q3452 -545 3434 -571Q3416 -597 3416 -633Q3416 -652 3424 -668Q3433 -683 3443 -683Q3452 -683 3452 -672Q3452 -665 3448 -657Q3443 -644 3443 -633Q3443 -606 3462 -582Q3481 -559 3508 -542Q3535 -525 3558 -515Q3622 -585 3698 -644Q3775 -704 3863 -740Q3951 -776 4048 -776Q4129 -776 4175 -740Q4221 -705 4221 -649Q4221 -599 4192 -564Q4164 -528 4118 -504Q4072 -481 4018 -468Q3965 -454 3913 -448Q3861 -443 3822 -443Q3765 -443 3712 -450Q3658 -457 3605 -472Q3579 -435 3548 -386Q3518 -338 3490 -284Q3463 -231 3446 -178Q3428 -126 3428 -81Q3428 -32 3451 -8Q3474 17 3513 17Q3560 17 3612 -12Q3665 -40 3718 -86Q3771 -132 3819 -186Q3867 -240 3905 -293Q3943 -346 3965 -387Q3982 -419 3998 -432Q4014 -446 4025 -446Q4036 -446 4042 -438Q4048 -429 4048 -415Q4048 -387 4023 -359Q3989 -320 3957 -264Q3925 -209 3905 -148Q3885 -88 3885 -35Q3885 2 3896 18Q3908 34 3927 34Q3956 34 3986 14Q4015 -5 4042 -38Q4069 -71 4092 -112Q4115 -152 4132 -193Q4137 -193 4140 -192Q4144 -191 4144 -184Q4127 -141 4104 -97Q4080 -53 4050 -16Q4020 20 3983 42Q3946 64 3902 64ZM3813 -467Q3853 -467 3902 -472Q3951 -476 4000 -488Q4048 -500 4089 -522Q4130 -544 4155 -578Q4180 -612 4180 -661Q4180 -705 4144 -728Q4107 -751 4051 -751Q3958 -751 3882 -714Q3805 -678 3742 -619Q3678 -560 3621 -492Q3665 -479 3712 -473Q3758 -467 3813 -467ZM4193 5Q4152 5 4135 -20Q4118 -45 4118 -81Q4118 -106 4124 -128Q4129 -150 4140 -178H4138Q4130 -178 4130 -186Q4130 -190 4138 -209Q4147 -228 4160 -255Q4174 -282 4188 -310Q4203 -338 4215 -360Q4235 -397 4259 -436Q4283 -476 4306 -512Q4330 -548 4346 -571Q4382 -621 4413 -621H4418Q4427 -621 4438 -618Q4450 -615 4460 -617Q4445 -601 4414 -560Q4384 -518 4348 -465Q4333 -443 4310 -406Q4288 -369 4263 -323Q4238 -277 4216 -230Q4195 -182 4181 -138Q4167 -93 4167 -58Q4167 -35 4175 -26Q4183 -17 4195 -17Q4210 -17 4230 -34Q4251 -52 4272 -80Q4294 -109 4312 -144Q4330 -178 4342 -214Q4353 -249 4353 -279Q4353 -308 4342 -321Q4332 -334 4315 -334Q4308 -334 4301 -330Q4294 -327 4289 -327Q4284 -327 4284 -332Q4284 -337 4294 -343Q4305 -349 4326 -349Q4345 -349 4364 -339Q4384 -329 4397 -306Q4410 -284 4410 -248Q4410 -205 4390 -160Q4370 -116 4338 -78Q4306 -41 4268 -18Q4229 5 4193 5ZM4519 0Q4478 0 4458 -30Q4439 -59 4439 -101Q4439 -140 4454 -182Q4470 -228 4498 -266Q4527 -304 4562 -328Q4596 -351 4630 -351Q4671 -351 4690 -323Q4710 -295 4710 -252Q4710 -222 4700 -189Q4690 -156 4673 -124Q4686 -111 4710 -111Q4738 -111 4758 -129Q4778 -147 4797 -193Q4809 -193 4809 -184Q4790 -138 4766 -116Q4741 -95 4703 -96Q4680 -96 4665 -109Q4637 -63 4598 -32Q4560 0 4519 0ZM4533 -22Q4556 -22 4579 -42Q4602 -61 4621 -86Q4640 -111 4648 -129Q4632 -158 4630 -172Q4627 -187 4627 -194Q4627 -213 4637 -223Q4647 -233 4657 -233Q4671 -233 4681 -221Q4683 -232 4684 -242Q4685 -251 4685 -260Q4685 -286 4676 -302Q4666 -319 4646 -319Q4625 -319 4602 -301Q4579 -283 4558 -253Q4538 -223 4523 -186Q4510 -155 4503 -128Q4496 -100 4496 -77Q4496 -52 4505 -37Q4514 -22 4533 -22ZM5014 3Q4991 3 4974 -10Q4956 -23 4956 -63Q4956 -80 4958 -95Q4961 -110 4965 -127Q4956 -112 4940 -90Q4924 -68 4904 -47Q4885 -26 4864 -12Q4844 2 4826 2Q4800 2 4784 -22Q4768 -45 4768 -83Q4768 -124 4787 -171Q4806 -218 4839 -261Q4872 -304 4915 -331Q4958 -358 5005 -358Q5028 -358 5049 -350Q5070 -343 5086 -326Q5093 -319 5093 -310Q5093 -304 5088 -300Q5083 -296 5075 -298Q5064 -333 5028 -333Q5011 -333 4989 -322Q4962 -308 4932 -278Q4901 -247 4874 -208Q4848 -170 4831 -131Q4814 -92 4814 -60Q4814 -27 4839 -27Q4861 -27 4884 -48Q4908 -69 4930 -100Q4951 -132 4969 -163Q4987 -194 4997 -213Q5012 -240 5025 -258Q5038 -276 5062 -276Q5073 -276 5084 -273Q5095 -270 5107 -272Q5077 -242 5054 -201Q5032 -160 5020 -120Q5008 -81 5008 -54Q5008 -24 5028 -24Q5044 -24 5062 -42Q5081 -60 5098 -88Q5116 -115 5131 -144Q5146 -172 5155 -193Q5160 -193 5164 -192Q5167 -191 5167 -184Q5166 -180 5164 -176Q5161 -171 5156 -160Q5148 -144 5134 -117Q5120 -90 5101 -62Q5082 -35 5060 -16Q5038 3 5014 3ZM5156 -196Q5164 -213 5177 -250Q5190 -288 5204 -334Q5218 -380 5225 -421Q5228 -437 5236 -444Q5244 -452 5253 -452Q5266 -452 5277 -440Q5288 -427 5288 -404Q5288 -376 5272 -356Q5255 -336 5231 -318Q5241 -317 5252 -316Q5263 -316 5276 -316Q5323 -316 5369 -322Q5371 -316 5371 -313Q5371 -300 5364 -280Q5356 -260 5348 -244Q5344 -235 5332 -212Q5320 -188 5306 -158Q5292 -129 5282 -100Q5273 -72 5273 -52Q5273 -26 5293 -26Q5312 -26 5346 -70Q5380 -115 5414 -193Q5426 -193 5426 -184Q5415 -157 5398 -125Q5382 -93 5362 -64Q5342 -36 5319 -18Q5296 1 5271 1Q5252 1 5233 -14Q5214 -30 5214 -65Q5214 -96 5226 -126Q5238 -155 5253 -181Q5268 -207 5280 -227Q5292 -247 5292 -259Q5292 -277 5270 -285Q5247 -293 5211 -294Q5193 -248 5184 -226Q5175 -204 5167 -184Q5151 -184 5156 -196ZM5643 0Q5609 0 5593 -23Q5577 -46 5577 -77Q5577 -86 5578 -96Q5579 -105 5582 -115Q5568 -93 5550 -66Q5531 -40 5508 -20Q5484 -1 5455 -1Q5442 -1 5426 -7Q5409 -13 5396 -30Q5384 -47 5384 -80Q5384 -123 5403 -171Q5422 -219 5455 -262Q5488 -304 5530 -330Q5572 -357 5617 -357Q5653 -357 5685 -338Q5700 -366 5717 -400Q5734 -435 5751 -469Q5768 -503 5781 -532Q5794 -560 5801 -575Q5816 -610 5830 -620Q5843 -629 5862 -629Q5873 -629 5886 -626Q5900 -624 5913 -625Q5908 -620 5890 -592Q5872 -564 5846 -520Q5820 -475 5790 -422Q5761 -369 5732 -314Q5704 -258 5680 -207Q5656 -156 5642 -117Q5628 -78 5628 -58Q5628 -45 5634 -36Q5640 -26 5654 -26Q5673 -26 5693 -45Q5713 -64 5732 -92Q5750 -121 5764 -148Q5779 -176 5786 -193Q5798 -193 5798 -184Q5789 -163 5774 -132Q5759 -101 5739 -71Q5719 -41 5694 -20Q5670 0 5643 0ZM5462 -30Q5476 -30 5497 -46Q5518 -61 5542 -95Q5570 -135 5606 -195Q5642 -255 5677 -322Q5670 -328 5662 -331Q5654 -334 5640 -334Q5617 -334 5590 -314Q5562 -295 5534 -264Q5507 -233 5484 -197Q5462 -161 5448 -128Q5435 -94 5435 -70Q5435 -30 5462 -30ZM5833 15Q5817 15 5807 5Q5797 -5 5797 -20Q5797 -40 5812 -54Q5828 -68 5846 -68Q5862 -68 5872 -58Q5882 -49 5882 -34Q5882 -15 5867 0Q5852 15 5833 15Z";

// one <path> per letter contour, so each stroke can be drawn in order
const SEGMENTS = NAME_PATH.split(/(?=M)/).filter(Boolean);

const TAMIL_DUST = Array.from({ length: 16 }, (_, i) => ({
  left: `${8 + ((i * 53) % 84)}%`,
  top: `${10 + ((i * 37) % 80)}%`,
  size: 2 + (i % 3),
  delay: (i % 7) * 0.45,
  dur: 5 + (i % 5),
}));

interface ScriptWordProps {
  id: string;
  lines: string[];
  ink: string;
  x: [number, number];
  feather: number;
  stroke: number;
  pen: number;
  className: string;
}

const INK_W = 9; // pen thickness: 8 = finer, 12 = bolder

const HEART_D = "M0 9C-16 -2 -15 -15 -6 -15C-2 -15 0 -12 0 -9C0 -12 2 -15 6 -15C15 -15 16 -2 0 9Z";

function InkGradient({ id }: { id: string }) {
  return (
    <linearGradient id={`${id}Ink`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={SCENE_W} y2="0">
      <stop offset="0%" stopColor="#5a3f12" />
      <stop offset="7%" stopColor="#0a0a10" />
      <stop offset="50%" stopColor="#1a1822" />
      <stop offset="93%" stopColor="#0a0a10" />
      <stop offset="100%" stopColor="#3b2a0e" />
    </linearGradient>
  );
}

// one handwritten word: outline is pen-drawn, then the ink wipes in behind the pen
function ScriptWord({ id, lines, x, feather, stroke, pen, className }: ScriptWordProps) {
  const [x0, x1] = x;
  const r = x1 - x0 + feather;
  const segs = lines;
  return (
    <svg className={`tamil-svg ${className}`} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} style={{ "--sw": stroke } as React.CSSProperties}>
      <defs>
        <InkGradient id={id} />
        <filter id={`${id}Soft`} x="-2%" y="-5%" width="104%" height="110%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -6" />
        </filter>
        <linearGradient id={`${id}Wipe`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" />
          <stop offset={`${((x1 - x0) / r) * 100}%`} stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </linearGradient>
        <mask id={`${id}Mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={SCENE_W} height={SCENE_H}>
          <rect className="tamil-wipe" x={x0 - r} y="0" width={r} height={SCENE_H} fill={`url(#${id}Wipe)`} data-x0={x0} data-r={r} />
        </mask>
      </defs>
      <path
        className="tamil-fill"
        d={lines.join("")}
        fill="none"
        stroke={`url(#${id}Ink)`}
        strokeWidth={INK_W}
        strokeLinecap="round"
        strokeLinejoin="round"
        mask={`url(#${id}Mask)`}
      />
      <g>
        {segs.map((s, i) => (
          <path key={i} className="tamil-line" d={s} stroke={`url(#${id}Ink)`} />
        ))}
      </g>
      <circle className="tamil-pen" r={pen} cx="0" cy="0" />
    </svg>
  );
}

// pen-drawn lines that stay fully visible (swoosh, heart, tail, underline)
function ScriptLines({ id, paths, stroke, pen, className }: { id: string; paths: string[]; stroke: number; pen: number; className: string }) {
  return (
    <svg className={`tamil-svg ${className}`} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} style={{ "--sw": stroke } as React.CSSProperties}>
      <defs>
        <InkGradient id={id} />
      </defs>
      <g>
        {paths.map((p, i) => (
          <path key={i} className="tamil-line tamil-line--solid" d={p} stroke={`url(#${id}Ink)`} />
        ))}
      </g>
      <circle className="tamil-pen" r={pen} cx="0" cy="0" />
    </svg>
  );
}

const GlassTypography = forwardRef<GlassTypographyHandle, Props>(function GlassTypography(
  { stage },
  ref
) {
  const nameRef = useRef<HTMLHeadingElement>(null);
  const tamilRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    get tamilEl() {
      return tamilRef.current;
    },
    get nameEl() {
      return nameRef.current;
    },
  }));

  return (
    <div className={`glass-type glass-type--${stage}`} aria-hidden="true">
      <p className="glass-hi">
        <i className="hi-pulse" />
        {HI_TEXT.split("").map((ch, i) => (
          <span key={i} className="hi-char" style={{ "--hi-i": i } as React.CSSProperties}>
            {ch}
          </span>
        ))}
        <span className="hi-pct" />
      </p>
      <h1 className="glass-name" ref={nameRef}>
        <svg className="script-svg" viewBox="-60 -900 6060 1300">
          <defs>
            <linearGradient id="inkGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" 	x2="5950" y2="0">
              <stop offset="0%" stopColor="#c9b27c" />
              <stop offset="50%" stopColor="#f3e8cc" />
              <stop offset="100%" stopColor="#c9b27c" />
            </linearGradient>
          </defs>
          <path className="script-fill" d={NAME_PATH} fill="url(#inkGrad)" />
          <g>
            {SEGMENTS.map((d, i) => (
              <path key={i} className="script-line" d={d} stroke="url(#inkGrad)" />
            ))}
          </g>
          <circle className="script-pen" r="32" cx="0" cy="0" />
        </svg>
      </h1>
      <div className="tamil-page" ref={tamilRef} aria-hidden="true">
        <span className="tamil-paper" />
        <span className="tamil-halo" />
        {TAMIL_DUST.map((p, i) => (
          <i
            key={i}
            className="tamil-dust"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}
          />
        ))}
                <div className="tamil-stage">
          <ScriptWord id="scrP" lines={PRIYAMUDAN_STROKES} ink={PRIYAMUDAN_INK} x={PRIYAMUDAN_X} feather={160} stroke={3} pen={12} className="tamil-svg--priya" />
          <ScriptLines id="scrF" paths={FLOURISH_PATHS} stroke={5} pen={9} className="tamil-svg--swoosh" />
          <ScriptWord id="scrV" lines={VIJAY_STROKES} ink={VIJAY_INK} x={VIJAY_X} feather={160} stroke={3} pen={12} className="tamil-svg--vijay" />
          <ScriptLines id="scrU" paths={[UNDERLINE_PATH]} stroke={5} pen={9} className="tamil-svg--under" />
          <svg className="tamil-svg tamil-svg--extras" viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}>
            <defs>
              <InkGradient id="scrX" />
              <linearGradient id="tamilGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f6dc8e" />
                <stop offset="45%" stopColor="#b8862b" />
                <stop offset="100%" stopColor="#2c1d08" />
              </linearGradient>
            </defs>
            {EXTRA_LINES.map((l, i) => (
              <path
                key={i}
                className="tamil-x"
                pathLength={1}
                d={l.d}
                stroke="url(#scrXInk)"
                style={{ strokeWidth: l.w, animationDelay: `${l.delay}s` }}
              />
            ))}
            {LEAVES.map((d, i) => (
              <path key={`lf${i}`} className="tamil-leaf" d={d} fill="url(#tamilGold)" style={{ animationDelay: `${0.9 + i * 0.18}s` }} />
            ))}
            <g transform={`translate(${BLACK_HEART[0]} ${BLACK_HEART[1]}) rotate(${BLACK_HEART[3]}) scale(${BLACK_HEART[2]})`}>
              <path className="tamil-miniheart" d={HEART_D} />
            </g>
          </svg>
          <svg className="tamil-svg tamil-svg--sparks" viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}>
            <defs>
              <InkGradient id="scrS" />
            </defs>
            {SPARK_PATHS.map((p, i) => (
              <path key={i} className="tamil-spark" d={p} stroke="url(#scrSInk)" />
            ))}
          </svg>
          <svg className="tamil-svg tamil-svg--hearts" viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}>
            <defs>
              <radialGradient id="tamilHeartGrad" cx="35%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#ffa3b5" />
                <stop offset="45%" stopColor="#ff3d5f" />
                <stop offset="100%" stopColor="#b3122f" />
              </radialGradient>
            </defs>
            <circle className="tamil-heart-ring" cx="2046" cy="205" r="40" />
            {([[1990, 300, 1.4, 0], [2070, 260, 1, 0.7], [1930, 340, 1.1, 1.4], [2100, 330, 0.8, 2.1], [2010, 380, 1.2, 2.8]] as [number, number, number, number][]).map(([fx, fy, fs, fd], i) => (
              <g key={`f${i}`} transform={`translate(${fx} ${fy}) scale(${fs})`}>
                <path className="tamil-float-heart" d={HEART_D} style={{ animationDelay: `${fd}s` }} />
              </g>
            ))}
            {RED_HEARTS.map(([hx, hy, hs, hr], i) => (
              <g key={i} transform={`translate(${hx} ${hy}) rotate(${hr}) scale(${hs})`}>
                <path className="tamil-heart" d={HEART_D} />
                <ellipse className="tamil-heart-shine" cx="-6" cy="-8" rx="3.6" ry="1.9" transform="rotate(-35 -6 -8)" />
              </g>
            ))}
          </svg>
        </div>
      </div>
      {stage === "assemble" && <span className="glass-shockwave" />}
    </div>
  );
});

export default GlassTypography;