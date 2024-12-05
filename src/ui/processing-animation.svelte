<div class="processing"></div>

<style>
  .processing {
    width: 12px;
    aspect-ratio: 1;
    border-radius: 50%;
    animation: l5 1.5s infinite linear;
  }

  @keyframes l5 {
    0% {
      box-shadow:
        20px 0 #fff2,
        -20px 0 #fff2;
      background: #fff2;
    }
    25% {
      box-shadow:
        20px 0 #fff2,
        -20px 0 #ffff;
      background: #fff2;
    }
    50% {
      box-shadow:
        20px 0 #fff2,
        -20px 0 #fff2;
      background: #ffff;
    }
    75% {
      box-shadow:
        20px 0 #ffff,
        -20px 0 #fff2;
      background: #fff2;
    }
    100% {
      box-shadow:
        20px 0 #fff2,
        -20px 0 #fff2;
      background: #fff2;
    }
  }
</style>
